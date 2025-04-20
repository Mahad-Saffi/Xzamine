from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from Xzamine.server.model.analysis_structured_output import Analysis
from Xzamine.server.model.prompt import system_message


model = ChatOllama(model="llama3.2:latest", temperature=0)
structured_model = model.with_structured_output(Analysis)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_message),
    ("user", "Analyze the following post: {post}")
])

def invoke_model(post: str) -> dict:
    """Invoke the model with the given post."""
    chain = prompt | structured_model
    result = chain.invoke({"post": post}).model_dump()
    return result
