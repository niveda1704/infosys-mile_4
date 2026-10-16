import re

# Controlled skill vocabulary derived from Day 2 Job Data EDA
CONTROLLED_SKILLS = [
    "Python", "SQL", "Git", "Machine Learning", "Deep Learning", "PyTorch",
    "TensorFlow", "AWS", "Docker", "Java", "React", "Node.js", "Excel",
    "Power BI", "Tableau", "Linux", "Pandas", "NumPy", "Scikit-learn",
    "C++", "C#", "HTML", "CSS", "JavaScript", "TypeScript", "REST API",
    "Flask", "Django", "Communication", "Azure", "Cyber Security", "NLP",
    "Computer Vision", "Spark", "Hadoop", "Data Analysis", "Data Engineering",
    "Kubernetes", "Agile"
]

def extract_skills(text: str) -> list[str]:
    """
    Extract skills from plain text using deterministic rule-based keyword matching.
    
    :param text: Raw text extracted from resume
    :return: List of detected skill names matching controlled vocabulary
    """
    if not text or not isinstance(text, str):
        return []

    found_skills = []
    text_lower = text.lower()

    for skill in CONTROLLED_SKILLS:
        # Custom regex patterns for special skill names (e.g. C++, C#, .NET, Node.js)
        if skill == "C++":
            pattern = r'(?i)\bc\+\+\b|c\+\+'
        elif skill == "C#":
            pattern = r'(?i)\bc#\b|c#'
        elif skill in ["Node.js", "Power BI", "Scikit-learn", "REST API", "Cyber Security", "Data Analysis", "Data Engineering", "Computer Vision", "Deep Learning", "Machine Learning"]:
            # Escaping special characters for multi-word or dotted skills
            escaped = re.escape(skill)
            pattern = rf'(?i)\b{escaped}\b'
        else:
            pattern = rf'(?i)\b{re.escape(skill)}\b'

        if re.search(pattern, text):
            found_skills.append(skill)

    # Return unique sorted list of matched skills
    return sorted(list(set(found_skills)))


if __name__ == "__main__":
    print("=== SwipeX Skill Extraction Module (src/skills.py) ===")
    sample_text = "Experienced Senior Software Developer with expertise in Python, SQL, Docker, AWS, and Machine Learning."
    skills = extract_skills(sample_text)
    print(f"Sample Resume Text: {sample_text}")
    print(f"Extracted Skills ({len(skills)}): {skills}")

