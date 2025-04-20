from pydantic import BaseModel, Field
from typing import Dict

class Analysis(BaseModel):
    post: str = Field(description="The post to analyze")
    probabilities: Dict[str, float] = Field(
        description="Probabilities for each legal classification category",
        examples={
            "Hate Speech (Sec 10A)": 0.1,
            "Cyber Terrorism (Sec 10)": 0.2,
            "Dignity Offences (Sec 18)": 0.05,
            "Modesty Offences (Sec 19)": 0.0,
            "Child Pornography (Sec 19A)": 0.0,
            "Cyber Stalking (Sec 21)": 0.05,
            "Spoofing (Sec 23)": 0.0,
            "Electronic Fraud (Sec 12)": 0.0,
            "Glorification of Terrorism (Sec 9)": 0.1,
            "Normal Post": 0.5
        }
    )
    final_sentiment: str = Field(
        description="The legal classification with the highest probability"
    )
    confidence_score: float = Field(
        description="The probability associated with the final_sentiment",
        ge=0, le=1
    )
    toxic_score: float = Field(
        description="Overall toxicity potential score",
        ge=0, le=1
    )
    rationale: str = Field(
        description="Detailed explanation of the classification, including step-by-step reasoning"
    )
    legal_definition: str = Field(
        description="Specific PECA section definition applied for the final_sentiment"
    )
    cultural_context: str = Field(
        description="Cultural/linguistic interpretation of sensitive terms in the post"
    )
    protected_group_analysis: str = Field(
        description="Identification of targeted protected groups per PECA"
    )
    