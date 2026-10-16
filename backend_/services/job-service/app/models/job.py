from datetime import datetime

from app.extensions import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(150), nullable=False)
    company = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(150), nullable=False)
    skills = db.Column(db.String(500), nullable=False)
    salary = db.Column(db.String(100), nullable=True)

    posted_time = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    applicant_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    competition_level = db.Column(
        db.String(10),
        nullable=False,
        default="LOW"
    )

    job_type = db.Column(
    db.String(50),
    nullable=False,
    default="FULL_TIME"
    )

    experience_level = db.Column(
    db.String(50),
    nullable=False,
    default="ENTRY_LEVEL"
    )

    def calculate_competition_level(self):
        if self.applicant_count >= 20:
            return "HIGH"
        elif self.applicant_count >= 10:
            return "MEDIUM"
        return "LOW"

    def to_dict(self):
        return {
            "id": self.id,
            "recruiter_id": self.recruiter_id,
            "title": self.title,
            "company": self.company,
            "description": self.description,
            "location": self.location,
            "skills": self.skills,
            "salary": self.salary,
            "job_type": self.job_type,
            "experience_level": self.experience_level,
            "posted_time": self.posted_time.isoformat(),
            "applicant_count": self.applicant_count,
            "competition_level": self.calculate_competition_level()
        }