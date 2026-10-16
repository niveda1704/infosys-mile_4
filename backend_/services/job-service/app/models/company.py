from app.extensions import db


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    about = db.Column(db.Text, nullable=False)
    industry = db.Column(db.String(150), nullable=False)
    size = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "about": self.about,
            "industry": self.industry,
            "size": self.size
        }