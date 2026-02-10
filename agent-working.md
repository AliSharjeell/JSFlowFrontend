# Walkthrough - LangGraph FastAPI RAG Agent

## Prerequisites
1. **Ollama**: Ensure Ollama is running (`ollama serve`) and you have pulled the embedding model:
   ```bash
   ollama pull nomic-embed-text
   ```
2. **Groq API Key**: Ensure you have a valid Groq API Key.
3. **MCP Server**: Ensure you have an MCP server ready (e.g., the filesystem server).

## Setup
1. **Environment Variables**:
   Copy [.env.example](file:///C:/Apps%20New/ProcomHackathon26Agent/.env.example) to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   - Set `GROQ_API_KEY`.
   - Set `PDF_FILE_PATH` to the absolute path of your PDF.
   - Set `MCP_SERVER_COMMAND` and `MCP_SERVER_ARGS` if using an MCP server.

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application
Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The server will start at `http://localhost:8000`. On startup, it will attempt to ingest the PDF specified in `.env`.

## Testing
You can test the API using `curl` or a tool like Postman.

### 1. RAG Chat
Ask a question about your PDF:
```bash
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{"question": "What is the summary of this document?", "thread_id": "test_1"}'
```

### 2. MCP Tool Use
Ask a question that requires the MCP tool (e.g., list files if using filesystem MCP):
```bash
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{"question": "List files in the current directory", "thread_id": "test_1"}'
```

### 3. Chat History
Check the `chat_history/` directory. You should see a markdown file (e.g., `thread_test_1.md`) containing the interaction log.


# Implementation Plan - LangGraph FastAPI RAG

## Goal Description
Create a simple FastAPI service that uses LangGraph to orchestrate a RAG pipeline.
- **LLM**: Groq API
- **Embeddings**: Local Ollama (`nomic-embed-text`)
- **Vector Store**: ChromaDB (Local persistance)
- **MCP**: Support for connecting to an external MCP server (stdio/sse).
- **Routing**: LLM-based classification to route between RAG and MCP tasks.
- **Memory**: LangGraph Checkpointer (`MemorySaver` or `SqliteSaver`) for session context.
- **Logging**: Append chat history to a Markdown file.
- **Input**: Hardcoded PDF Document Path (Configured in `.env`).

## Proposed Changes

### Configuration
#### [NEW] `requirements.txt`
- `fastapi`, `uvicorn`, `langgraph`, `langchain`, `langchain-groq`, `langchain-community`, `langchain-chroma`, `pypdf`, `python-dotenv`, `mcp`.

#### [NEW] `.env.example`
- `GROQ_API_KEY`
- `OLLAMA_BASE_URL` (default: http://localhost:11434)
- `MCP_SERVER_COMMAND`
- `MCP_SERVER_ARGS`
- `PDF_FILE_PATH` (absolute path to the PDF file)

### Core Logic

#### [NEW] `rag.py`
- Function `ingest_pdf()`:
    - Reads `PDF_FILE_PATH` from env.
    - Check if vector store exists; if not, ingest.
    - Load PDF using `PyPDFLoader`.
    - Split text using `RecursiveCharacterTextSplitter`.
    - Embed using `OllamaEmbeddings` (model=`nomic-embed-text`).
    - Store in `Chroma` vector store.
- Function `get_retriever()`:
    - Returns the retriever interface from Chroma.

#### [NEW] `mcp_client.py`
- Setup MCP Client using `mcp` python SDK.
- Connect to server (stdio).
- Expose available tools to LangChain/LangGraph.

#### [NEW] `graph.py`
- Defined StateGraph (`MessagesState`):
    - State: `{"messages": list, "context": str, "classification": str}`
    - Nodes:
        - `classifier`: Uses `ChatGroq` to classify intent.
        - `rag_agent`: 
          - Retrieve docs using `rag.py`.
          - Augment last message with context.
          - Generate answer using `ChatGroq`.
        - `mcp_agent`: 
          - Call `mcp_client.py` tools.
    - Checkpointer: Uses `MemorySaver()` to persist state between turns within a thread.
    - Edges: Same as prior plan.

#### [NEW] `logger.py`
- Function `log_interaction(thread_id: str, question: str, answer: str)`:
    - Appends the interaction to `chat_history/thread_{thread_id}.md`.

#### [NEW] `main.py`
- FastAPI app definition.
- Lifecycle manager:
    - Start MCP client.
    - Trigger `rag.ingest_pdf()` (idempotent check).
- Endpoint `POST /chat`: 
    - Accepts `question` and optional `thread_id`. 
    - Runs the LangGraph with the given `thread_id`.
    - Calls `logger.log_interaction`.

## Verification Plan
### Automated Tests
- None for this simple setup.
### Manual Verification
- Run `uvicorn main:app --reload`.
- Ensure server logs show PDF ingestion (or skipping if already done).
- Trigger `/chat` (thread_id="1") with "My name is Alish".
- Trigger `/chat` (thread_id="1") with "What is my name?" (Expect "Alish").
- Check `chat_history/thread_1.md` for logs.
