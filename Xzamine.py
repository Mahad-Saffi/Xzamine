from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import Literal, Annotated, Dict


model = ChatOllama(model="llama3.2:latest", temperature=0)

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
    
structured_model = model.with_structured_output(Analysis)

system_message = """
You are a legal content analysis model for Pakistan's cyber laws. Your task is to analyze social media posts and classify them under the relevant sections of the Prevention of Electronic Crimes Act (PECA) 2016. Below are the detailed definitions of each PECA category:
...

### Output Format
Your output should be a JSON object with the following structure:
{{
    "post": "The original post",
    "probabilities": {{
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
    }},
    "final_sentiment": "The category with the highest probability",
    "confidence_score": 0.5,
    "toxic_score": 0.4,
    "rationale": "Detailed explanation of the classification, including step-by-step reasoning",
    "legal_definition": "Definition of the final_sentiment category",
    "cultural_context": "Cultural interpretation of terms",
    "protected_group_analysis": "Identification of targeted groups"
}}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_message),
    ("user", "Analyze the following post: {post}")
])

chain = prompt | structured_model

result = chain.invoke({"post": "You are a fucking freak"}).model_dump()

print(result)