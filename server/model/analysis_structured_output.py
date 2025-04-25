from pydantic import BaseModel, Field
from typing import Dict

# Pydantic model for quick sentiment classification
class SentimentResult(BaseModel):
    final_sentiment: str = Field(
        description="The legal classification of the post (e.g., 'Hate Speech (Sec 10A)' or 'Normal Post')"
    )
    confidence_score: float = Field(
        description="The probability associated with the final_sentiment",
        ge=0, le=1
    )

# Pydantic model for detailed analysis
class Analysis(BaseModel):
    post: str = Field(description="The post to analyze")  # Added missing field
    probabilities: Dict[str, float] = Field(
        description="Probabilities for each legal classification category (e.g., 'Hate Speech (Sec 10A)': 0.1, 'Normal Post': 0.5)"
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