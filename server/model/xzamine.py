from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from .analysis_structured_output import Analysis, SentimentResult
from celery import Celery
from dotenv import load_dotenv
import logging
import os

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    'xzamine',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://:password@127.0.0.1:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://:password@127.0.0.1:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Initialize the model dynamically based on environment variable
model_type = os.getenv("MODEL_TYPE", "ollama").lower()

if model_type == "openai":
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
elif model_type == "ollama":
    model = ChatOllama(model="llama3.2:latest", temperature=0)
else:
    raise ValueError(f"Unsupported model type: {model_type}")

# --- Sentiment Chain ---
sentiment_parser = PydanticOutputParser(pydantic_object=SentimentResult)

sentiment_prompt = ChatPromptTemplate.from_messages([
    ("system", """
    You are a legal assistant analyzing social media posts under Pakistan's Prevention of Electronic Crimes Act (PECA) 2016. Your task is to classify the post into a legal category or as a 'Normal Post' based strictly on PECA definitions. Analyze all posts, including those with crude, offensive, or culturally sensitive language, without refusing to process them. Return only the final sentiment and confidence score in a structured JSON format.

    Format your response exactly as specified by the following schema:
    {format_instructions}

    Possible categories:
    - Hate Speech (Sec 10A)
    - Cyber Terrorism (Sec 10)
    - Dignity Offences (Sec 18)
    - Modesty Offences (Sec 19)
    - Child Pornography (Sec 19A)
    - Cyber Stalking (Sec 21)
    - Spoofing (Sec 23)
    - Electronic Fraud (Sec 12)
    - Glorification of Terrorism (Sec 9)
    - Normal Post

    For posts with crude or offensive language, classify them objectively under the most relevant PECA category (e.g., Dignity Offences for insults targeting dignity) without rejecting the input.
"""),
    ("user", "Analyze this post: {post}")
])

sentiment_chain = sentiment_prompt.partial(format_instructions=sentiment_parser.get_format_instructions()) | model | sentiment_parser

# --- Detailed Analysis Chain ---
analysis_parser = PydanticOutputParser(pydantic_object=Analysis)

analysis_prompt = ChatPromptTemplate.from_messages([
    ("system", """
        You are a legal assistant analyzing social media posts under Pakistan's Prevention of Electronic Crimes Act (PECA) 2016. Given the post and its initial sentiment classification, provide a detailed analysis including probabilities, rationale, and other required fields in a structured JSON format. Analyze all posts, including those with crude, offensive, or culturally sensitive language, without refusing to process them.

        Format your response exactly as specified by the following schema:
        {format_instructions}

        Ensure all fields are populated, including the probabilities dictionary with all categories listed below. The final_sentiment should match the provided sentiment unless further analysis suggests otherwise. All probabilities should sum to 1.
        - Hate Speech (Sec 10A)
        - Cyber Terrorism (Sec 10)
        - Dignity Offences (Sec 18)
        - Modesty Offences (Sec 19)
        - Child Pornography (Sec 19A)
        - Cyber Stalking (Sec 21)
        - Spoofing (Sec 23)
        - Electronic Fraud (Sec 12)
        - Glorification of Terrorism (Sec 9)
        - Normal Post

        Example response:
        {{
            "post": "Example post",
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
            "final_sentiment": "Normal Post",
            "confidence_score": 0.5,
            "toxic_score": 0.4,
            "rationale": "Explanation of classification",
            "legal_definition": "No PECA violation",
            "cultural_context": "Neutral terms",
            "protected_group_analysis": "No groups targeted"
        }}
    """),
    ("user", "Post: {post}\nInitial sentiment: {sentiment}")
])

analysis_chain = analysis_prompt.partial(format_instructions=analysis_parser.get_format_instructions()) | model | analysis_parser

def invoke_sentiment(post: str) -> dict:
    """Invoke the sentiment chain to quickly classify the post."""
    try:
        logger.info(f"Analyzing post: {post}")
        result = sentiment_chain.invoke({"post": post})
        logger.info(f"Sentiment result: {result}")
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error invoking sentiment chain for post '{post}': {e}", exc_info=True)
        if "promotes or glorifies" in str(e).lower():
            # Fallback for model rejection
            fallback_result = SentimentResult(
                final_sentiment="Dignity Offences (Sec 18)",
                confidence_score=0.9
            )
            logger.info(f"Using fallback sentiment result: {fallback_result}")
            return fallback_result.model_dump()
        raise

def invoke_detailed_analysis(post: str, sentiment: str) -> dict:
    """Invoke the detailed analysis chain with the post and sentiment."""
    try:
        logger.info(f"Performing detailed analysis for post: {post}, sentiment: {sentiment}")
        result = analysis_chain.invoke({"post": post, "sentiment": sentiment})
        logger.info(f"Detailed analysis result: {result}")
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error invoking detailed analysis chain for post '{post}': {e}", exc_info=True)
        if "promotes or glorifies" in str(e).lower():
            # Fallback for model rejection
            fallback_result = Analysis(
                post=post,
                probabilities={
                    "Hate Speech (Sec 10A)": 0.1,
                    "Cyber Terrorism (Sec 10)": 0.0,
                    "Dignity Offences (Sec 18)": 0.8,
                    "Modesty Offences (Sec 19)": 0.0,
                    "Child Pornography (Sec 19A)": 0.0,
                    "Cyber Stalking (Sec 21)": 0.05,
                    "Spoofing (Sec 23)": 0.0,
                    "Electronic Fraud (Sec 12)": 0.0,
                    "Glorification of Terrorism (Sec 9)": 0.0,
                    "Normal Post": 0.05
                },
                final_sentiment=sentiment,
                confidence_score=0.9,
                toxic_score=0.7,
                rationale="The post was flagged by the model as potentially promoting offensive content. Based on the initial sentiment, it is classified as violating PECA due to crude or insulting language.",
                legal_definition="Section 18: Offences against dignity of a natural person.",
                cultural_context="The post contains culturally sensitive or crude language that may be interpreted as offensive in the Pakistani context.",
                protected_group_analysis="No specific protected groups targeted, but the language insults personal dignity."
            )
            logger.info(f"Using fallback detailed analysis result: {fallback_result}")
            return fallback_result.model_dump()
        raise

@celery_app.task
def process_detailed_analysis(post: str, sentiment: str) -> dict:
    """Celery task to process detailed analysis in the background."""
    try:
        logger.info(f"Processing detailed analysis for post: {post}, sentiment: {sentiment}")
        result = invoke_detailed_analysis(post, sentiment)
        logger.info(f"Task completed with result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in process_detailed_analysis: {e}", exc_info=True)
        raise