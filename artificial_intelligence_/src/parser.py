import io
import re
import pdfplumber
import docx

def clean_text(text: str) -> str:
    """Normalize line endings while preserving intentional whitespace and paragraph breaks."""
    if not text:
        return ""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    return cleaned.strip()


def extract_text_from_pdf(pdf_source) -> str:
    """
    Extract readable text from a PDF resume file using pdfplumber.
    
    :param pdf_source: File path (str/Path) or file-like byte stream
    :return: Extracted raw text string
    :raises ValueError: If PDF is invalid, corrupted, or contains no readable text.
    """
    extracted_text = []
    
    try:
        if isinstance(pdf_source, bytes):
            pdf_file = io.BytesIO(pdf_source)
        elif hasattr(pdf_source, 'read'):
            content = pdf_source.read()
            if hasattr(pdf_source, 'seek'):
                pdf_source.seek(0)
            pdf_file = io.BytesIO(content) if isinstance(content, bytes) else io.BytesIO(content.encode('utf-8'))
        else:
            pdf_file = pdf_source

        with pdfplumber.open(pdf_file) as pdf:
            if not pdf.pages:
                return ""
            
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
                    
        full_text = "\n".join(extracted_text).strip()
        if not full_text:
            return ""
            
        return clean_text(full_text)
        
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to parse PDF resume: {str(e)}")


def extract_text_from_docx(docx_source) -> str:
    """
    Extract readable text from a DOCX resume file using python-docx.
    
    :param docx_source: File path (str/Path) or file-like byte stream
    :return: Extracted raw text string
    :raises ValueError: If DOCX is invalid, corrupted, or contains no readable text.
    """
    extracted_text = []
    
    try:
        if isinstance(docx_source, bytes):
            docx_file = io.BytesIO(docx_source)
        elif hasattr(docx_source, 'read'):
            content = docx_source.read()
            if hasattr(docx_source, 'seek'):
                docx_source.seek(0)
            docx_file = io.BytesIO(content) if isinstance(content, bytes) else io.BytesIO(content.encode('utf-8'))
        else:
            docx_file = docx_source
            
        doc = docx.Document(docx_file)
        for para in doc.paragraphs:
            if para.text:
                extracted_text.append(para.text)
                
        full_text = "\n".join(extracted_text).strip()
        if not full_text:
            return ""
            
        return clean_text(full_text)
        
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to parse DOCX resume: {str(e)}")


def extract_text(file_source, filename: str) -> str:
    """
    Detect file type from filename and extract text using appropriate handler.
    
    :param file_source: File path or file-like object/bytes
    :param filename: Original filename to determine extension
    :return: Extracted plain text string
    :raises ValueError: For unsupported file types or extraction failures.
    """
    if not filename or not isinstance(filename, str):
        raise ValueError("Invalid filename provided.")
        
    filename_lower = filename.lower()
    
    if filename_lower.endswith('.pdf'):
        return extract_text_from_pdf(file_source)
    elif filename_lower.endswith('.docx'):
        return extract_text_from_docx(file_source)
    else:
        raise ValueError("Unsupported file type. Only .pdf and .docx are supported.")


if __name__ == "__main__":
    print("=== SwipeX Resume Parser Module (src/parser.py) ===")
    print("Module imported successfully. Accepts PDF and DOCX files to extract and clean text.")
