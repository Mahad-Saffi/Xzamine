from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from .analysis_structured_output import Analysis, SentimentResult
from .prompt import sentiment_system_prompt, analysis_system_prompt
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

# Initialize the model
# model = ChatOpenAI(model="gpt-4o-mini", temperature=0)

model = ChatOllama(model="llama3.2:latest", temperature=0)

# --- Sentiment Chain ---
sentiment_parser = PydanticOutputParser(pydantic_object=SentimentResult)

sentiment_prompt = ChatPromptTemplate.from_messages([
    ("system", sentiment_system_prompt),
    ("user", "Analyze this post: {post}")
])

sentiment_chain = sentiment_prompt.partial(format_instructions=sentiment_parser.get_format_instructions()) | model | sentiment_parser

# --- Detailed Analysis Chain ---
analysis_parser = PydanticOutputParser(pydantic_object=Analysis)

analysis_prompt = ChatPromptTemplate.from_messages([
    ("system", analysis_system_prompt),
    ("user", "Post: {post}\nInitial sentiment: {sentiment}")
])

analysis_chain = analysis_prompt.partial(format_instructions=analysis_parser.get_format_instructions()) | model | analysis_parser

def invoke_sentiment(post: str) -> dict:
    """Invoke the sentiment chain to quickly classify the post."""
    try:
        result = sentiment_chain.invoke({"post": post})
        logger.info(f"Sentiment result: {result}")
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error invoking sentiment chain: {e}")
        raise

def invoke_detailed_analysis(post: str, sentiment: str) -> dict:
    """Invoke the detailed analysis chain with the post and sentiment."""
    try:
        result = analysis_chain.invoke({"post": post, "sentiment": sentiment})
        logger.info(f"Detailed analysis result: {result}")
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error invoking detailed analysis chain: {e}")
        raise

@celery_app.task
def process_detailed_analysis(post: str, sentiment: str) -> dict:
    """Celery task to process detailed analysis in the background."""
    return invoke_detailed_analysis(post, sentiment)