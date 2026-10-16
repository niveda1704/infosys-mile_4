from app.extensions import db


class Swipe(db.Model):
    __tablename__ = "swipes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    action = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "job_id": self.job_id,
            "action": self.action
        }