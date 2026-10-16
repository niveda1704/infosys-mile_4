from app.extensions import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=True)

    # M3 parsing fields
    parsed_text = db.Column(db.Text, nullable=True)
    extracted_skills = db.Column(db.Text, nullable=True)

    ats_score = db.Column(db.Integer, nullable=True)
    external_resume_id = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "file_path": self.file_path,
            "parsed_text": self.parsed_text,
            "extracted_skills": self.extracted_skills,
            "ats_score": self.ats_score,
            "external_resume_id": self.external_resume_id
        }