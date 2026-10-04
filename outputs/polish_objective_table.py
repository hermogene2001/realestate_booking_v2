from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


DOCX_PATH = Path(r"E:\realestate_booking\bachelor_of_technology_capstone_project.docx")


def ensure_child(parent, tag):
    child = parent.find(qn(tag))
    if child is None:
        child = OxmlElement(tag)
        parent.append(child)
    return child


def set_width(parent, tag, width_dxa):
    width = ensure_child(parent, tag)
    width.set(qn("w:type"), "dxa")
    width.set(qn("w:w"), str(width_dxa))


def set_cell_margins(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = ensure_child(tc_pr, "w:tcMar")
    for side, value in {"top": 120, "bottom": 120, "start": 120, "end": 120}.items():
        margin = ensure_child(tc_mar, f"w:{side}")
        margin.set(qn("w:w"), str(value))
        margin.set(qn("w:type"), "dxa")


def mark_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = tr_pr.find(qn("w:tblHeader"))
    if tbl_header is None:
        tbl_header = OxmlElement("w:tblHeader")
        tr_pr.append(tbl_header)
    tbl_header.set(qn("w:val"), "true")


def apply_geometry(table, widths):
    tbl_pr = table._tbl.tblPr
    set_width(tbl_pr, "w:tblW", sum(widths))
    tbl_ind = ensure_child(tbl_pr, "w:tblInd")
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")

    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        grid_col = OxmlElement("w:gridCol")
        grid_col.set(qn("w:w"), str(width))
        grid.append(grid_col)

    for row in table.rows:
        for index, cell in enumerate(row.cells):
            set_width(cell._tc.get_or_add_tcPr(), "w:tcW", widths[index])
            set_cell_margins(cell)


doc = Document(DOCX_PATH)
for table in doc.tables:
    first_row = " | ".join(cell.text.strip() for cell in table.rows[0].cells)
    if "Research objective" in first_row and "Numerical evidence" in first_row:
        mark_header(table.rows[0])
        apply_geometry(table, [2500, 4300, 2700])
        break
else:
    raise RuntimeError("Objective achievement table not found")

doc.save(DOCX_PATH)
print("Polished objective achievement table")
