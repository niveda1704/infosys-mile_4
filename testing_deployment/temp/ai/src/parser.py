import io
import pdfplumber

def extract_text_from_pdf(pdf_source) -> str:
    """
    Extract readable text from a PDF resume file using pdfplumber.
    
    :param pdf_source: File path (str/Path) or file-like byte stream (BytesIO/UploadFile stream)
    :return: Extracted raw text string
    :raises ValueError: If PDF is invalid, corrupted, or contains no readable text.
    """
    extracted_text = []
    
    try:
        if isinstance(pdf_source, bytes):
            pdf_file = io.BytesIO(pdf_source)
        elif hasattr(pdf_source, 'read'):
            content = pdf_source.read()
            pdf_file = io.BytesIO(content)
        else:
            pdf_file = pdf_source

        with pdfplumber.open(pdf_file) as pdf:
            if not pdf.pages:
                raise ValueError("PDF file contains no pages.")
            
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
                    
        full_text = "\n".join(extracted_text).strip()
        if not full_text:
            raise ValueError("No readable text could be extracted from the PDF.")
            
        return full_text
        
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to parse PDF resume: {str(e)}")


if __name__ == "__main__":
    print("=== SwipeX PDF Parser Module (src/parser.py) ===")
    print("Module imported successfully. Accepts PDF file paths or byte streams to extract text.")

