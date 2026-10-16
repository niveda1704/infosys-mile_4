"""Model registry — import order matters for Alembic autogenerate."""
from app.models.enums import (  # noqa: F401
    ApplicationStatus,
    AuthProvider,
    CompanyType,
    CompetitionLevel,
    DeliveryStatus,
    ExperienceLevel,
    JobType,
    NotificationChannel,
    NotificationType,
    ParseStatus,
    PortfolioKind,
    SuggestionSource,
    SwipeAction,
    SwipeDirection,
    UserRole,
    WorkMode,
)
from app.models.user import User, RefreshToken, UserProfile, ProfileExperience, PortfolioItem  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.resume import Resume, ResumeSkill, ResumeVersion  # noqa: F401
from app.models.swipe import (  # noqa: F401
    Application,
    ApplicationStatusEvent,
    SavedJob,
    Swipe,
)
from app.models.ats import ATSScore, RecommendationEvent  # noqa: F401
from app.models.notification import (  # noqa: F401
    AlertPreference,
    DeviceToken,
    Notification,
    NotificationDelivery,
)
from app.models.analytics import DailyJobStat, SkillDemandDaily  # noqa: F401