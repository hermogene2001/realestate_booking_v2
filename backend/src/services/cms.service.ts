import { prisma } from '../config/database';

export class CMSService {
  static async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    authorId: number;
  }) {
    const slug = this.generateSlug(data.title);
    
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return post;
  }

  static async getPost(slug: string) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  static async getAllPosts(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : { status: 'PUBLISHED' };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async publishPost(postId: number) {
    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return post;
  }

  static async updatePost(postId: number, data: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
  }) {
    const allowed: (keyof typeof data)[] = ['title', 'content', 'excerpt', 'coverImage'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    if (data.title) {
      updateData.slug = this.generateSlug(data.title);
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });

    return post;
  }

  static async deletePost(postId: number) {
    await prisma.blogPost.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted' };
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
