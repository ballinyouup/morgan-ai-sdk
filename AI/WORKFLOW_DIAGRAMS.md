# AI Agents Workflow Diagrams

## Overall Architecture

```mermaid
graph TB
    Input[User Input: Files, Text, Audio, Images] --> Convert[Text Conversion Layer]
    Convert --> Orch[AI Orchestrator<br/>Gemini 2.5 Flash]
    
    Orch --> |Intent: Communication| Coms[Coms Agent]
    Orch --> |Intent: Document Processing| Doc[Doc Agent]
    Orch --> |Intent: Strategic Analysis| Collab[Collaborative Mode]
    
    Collab --> DocAnalysis[Doc Agent<br/>Logical Analysis]
    DocAnalysis --> SherlockAnalysis[Sherlock Agent<br/>Strategic Analysis]
    SherlockAnalysis --> |Iteration 1-10| Conversation[Agent Conversation]
    Conversation --> |Consensus| ConsensusSum[Consensus Summary]
    ConsensusSum --> ComsFormat[Coms Agent<br/>Format for Client]
    
    Coms --> Output[Client Output]
    Doc --> Output
    ComsFormat --> Output
    
    style Orch fill:#4A90E2,stroke:#333,stroke-width:3px,color:#fff
    style Collab fill:#E8A838,stroke:#333,stroke-width:2px
    style Output fill:#7ED321,stroke:#333,stroke-width:2px
```

## Routing Decision Flow

```mermaid
flowchart TD
    Start[Request Received] --> Analyze[Orchestrator<br/>Analyzes Intent]
    
    Analyze --> CheckComms{Communication<br/>Keywords?}
    CheckComms --> |Yes: email, draft, message| RouteComms[Route to<br/>Coms Agent]
    
    CheckComms --> |No| CheckDocs{Document<br/>Keywords?}
    CheckDocs --> |Yes: process, extract, classify| CheckAnalysis{Analysis<br/>Keywords?}
    CheckAnalysis --> |No| RouteDocs[Route to<br/>Doc Agent]
    
    CheckAnalysis --> |Yes| RouteCollab[Route to<br/>Collaborative Mode]
    CheckDocs --> |No| CheckStrategy{Strategy<br/>Keywords?}
    CheckStrategy --> |Yes: analyze, recommend, evaluate| RouteCollab
    CheckStrategy --> |No| Default[Default to<br/>Collaborative Mode]
    
    RouteComms --> Output[Return Response]
    RouteDocs --> Output
    RouteCollab --> Output
    Default --> Output
    
    style Analyze fill:#4A90E2,stroke:#333,stroke-width:2px,color:#fff
    style RouteComms fill:#BD10E0,stroke:#333,stroke-width:2px,color:#fff
    style RouteDocs fill:#50E3C2,stroke:#333,stroke-width:2px
    style RouteCollab fill:#E8A838,stroke:#333,stroke-width:2px
```

## Collaborative Mode Detail

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant D as Doc Agent
    participant S as Sherlock Agent
    participant C as Coms Agent
    participant Client as Client/API
    
    Client->>O: Strategic Analysis Request
    O->>O: Analyze Intent
    O->>D: Process Documents
    D->>D: Extract Text<br/>Classify<br/>Extract Key Info
    D-->>O: Document Data
    
    O->>D: Request Logical Analysis
    D->>D: Analyze Evidence<br/>Calculate Damages<br/>Assess Facts
    D-->>O: Logical Perspective
    
    O->>S: Request Strategic Analysis
    S->>S: Find Patterns<br/>Identify Strategy<br/>Creative Solutions
    S-->>O: Strategic Perspective
    
    rect rgb(255, 240, 200)
        Note over D,S: Conversation Loop (Max 10 iterations)
        O->>D: Present Sherlock's View
        D->>D: Evaluate & Respond
        D-->>O: Counter-argument or Agreement
        
        O->>S: Present Doc's View
        S->>S: Evaluate & Respond
        S-->>O: Counter-argument or Agreement
        
        O->>O: Check Consensus
        
        alt Consensus Reached
            O->>O: Generate Summary
        else Max Iterations
            O->>O: Force Consensus
        end
    end
    
    O->>C: Format Consensus
    C->>C: Format for Client<br/>Plain Language<br/>Actionable
    C-->>O: Formatted Response
    
    O-->>Client: Final Response
```

## Agent Conversation Flow

```mermaid
stateDiagram-v2
    [*] --> Init: Strategic Question
    
    Init --> DocProcessing: Process Documents
    DocProcessing --> DocAnalysis: Documents Ready
    
    DocAnalysis --> SherlockAnalysis: Logical View Ready
    SherlockAnalysis --> Conversation: Strategic View Ready
    
    state Conversation {
        [*] --> DocTurn
        DocTurn --> CheckConsensus: Present Argument
        CheckConsensus --> SherlockTurn: No Consensus
        SherlockTurn --> CheckConsensus: Counter Argument
        CheckConsensus --> Consensus: Agreement Found
        CheckConsensus --> MaxIterations: Iteration Limit
        MaxIterations --> Consensus
        Consensus --> [*]
    }
    
    Conversation --> FormatOutput: Consensus Reached
    FormatOutput --> [*]: Client Response
```

## File Processing Pipeline

```mermaid
graph LR
    Files[Input Files] --> PDF{PDF?}
    Files --> IMG{Image?}
    Files --> AUD{Audio?}
    Files --> TXT{Text?}
    
    PDF --> |PyPDF2| ExtractPDF[Extract Text]
    IMG --> |Tesseract OCR| ExtractIMG[Extract Text]
    AUD --> |Speech Recognition| ExtractAUD[Transcribe]
    TXT --> |Read| ExtractTXT[Read Text]
    
    ExtractPDF --> Classify[Classify Document]
    ExtractIMG --> Classify
    ExtractAUD --> Classify
    ExtractTXT --> Classify
    
    Classify --> Extract[Extract Key Info]
    Extract --> Dates[Dates]
    Extract --> Amounts[Dollar Amounts]
    Extract --> Names[Names/Entities]
    Extract --> Contacts[Emails/Phones]
    
    Dates --> Store[Structured Data]
    Amounts --> Store
    Names --> Store
    Contacts --> Store
    
    Store --> Analysis[Ready for Analysis]
    
    style Files fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    style Analysis fill:#C8E6C9,stroke:#388E3C,stroke-width:2px
```

## API Request Flow

```mermaid
sequenceDiagram
    participant Client as Next.js Client
    participant API as FastAPI Server
    participant O as Orchestrator
    participant A as Agent(s)
    participant DB as Database
    
    Client->>API: POST /api/chat
    API->>API: Validate Request
    API->>O: Forward Request
    
    O->>O: Analyze Intent
    O->>A: Route to Agent(s)
    
    alt Single Agent
        A->>A: Process Request
        A-->>O: Response
    else Collaborative Mode
        A->>A: Agent 1 Analysis
        A->>A: Agent 2 Analysis
        A->>A: Conversation
        A-->>O: Consensus
    end
    
    O->>DB: Log Conversation
    O-->>API: Formatted Response
    API-->>Client: JSON Response
    
    Client->>Client: Display to User
```

## Complete Workflow Example

```mermaid
graph TB
    Start[User: "Analyze case_1 and<br/>recommend settlement strategy"] --> API[POST /api/chat]
    
    API --> Orch[Orchestrator Receives]
    Orch --> Intent[Intent Analysis]
    
    Intent --> Keywords{Detect Keywords:<br/>analyze, recommend}
    Keywords --> Route[Route to<br/>Collaborative Mode]
    
    Route --> Step1[Step 1:<br/>Doc Agent Processes Files]
    Step1 --> Step2[Step 2:<br/>Doc Agent Logical Analysis]
    Step2 --> Step3[Step 3:<br/>Sherlock Strategic Analysis]
    
    Step3 --> Loop[Conversation Loop]
    
    Loop --> Iter1[Iteration 1:<br/>Doc presents facts]
    Iter1 --> Iter2[Iteration 2:<br/>Sherlock adds strategy]
    Iter2 --> Iter3[Iteration 3:<br/>Doc refines]
    Iter3 --> Iter4[Iteration 4:<br/>Sherlock agrees]
    
    Iter4 --> Check{Consensus?}
    Check --> |Yes| Consensus[Generate Consensus]
    Check --> |No + More Iters| Loop
    
    Consensus --> Format[Coms Agent<br/>Formats Response]
    Format --> Response[Return to Client]
    
    Response --> Display[Display:<br/>- Case Strength: Good 75/100<br/>- Settlement: $50k-65k<br/>- Strategy: Emphasize liability<br/>- Next Steps: 5 action items]
    
    style Start fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px
    style Orch fill:#4A90E2,stroke:#333,stroke-width:2px,color:#fff
    style Loop fill:#FFF3E0,stroke:#FF9800,stroke-width:2px
    style Display fill:#C8E6C9,stroke:#388E3C,stroke-width:3px
```

## Use Case Examples

### Use Case 1: Quick Email Draft

```mermaid
graph LR
    User[User Request:<br/>"Draft email to client"] --> Orch[Orchestrator]
    Orch --> |Direct Route| Coms[Coms Agent]
    Coms --> Draft[Generate Email:<br/>- Greeting<br/>- Body<br/>- Closing]
    Draft --> Return[Return Draft]
    
    style Orch fill:#4A90E2,color:#fff
    style Coms fill:#BD10E0,color:#fff
```

### Use Case 2: Document Processing Only

```mermaid
graph LR
    User[User Request:<br/>"Process PDF documents"] --> Orch[Orchestrator]
    Orch --> |Direct Route| Doc[Doc Agent]
    Doc --> Extract[Extract Text]
    Extract --> Classify[Classify Types]
    Classify --> Keys[Extract Key Info]
    Keys --> Return[Return Structured Data]
    
    style Orch fill:#4A90E2,color:#fff
    style Doc fill:#50E3C2
```

### Use Case 3: Strategic Analysis (Collaborative)

```mermaid
graph TB
    User[User Request:<br/>"Should I settle or litigate?"] --> Orch[Orchestrator]
    Orch --> |Collaborative Route| Both[Doc + Sherlock]
    
    Both --> Doc[Doc Agent:<br/>Facts & Evidence]
    Both --> Sherlock[Sherlock Agent:<br/>Strategy & Patterns]
    
    Doc --> Talk[Agents Converse]
    Sherlock --> Talk
    
    Talk --> Cons[Reach Consensus]
    Cons --> Coms[Coms Formats]
    Coms --> Return[Return Recommendation]
    
    style Orch fill:#4A90E2,color:#fff
    style Both fill:#E8A838
    style Talk fill:#FFF3E0,stroke:#FF9800,stroke-width:2px
```

---

## Legend

**Colors:**
- 🔵 Blue: Orchestrator/Router
- 🟣 Purple: Coms Agent
- 🟢 Teal: Doc Agent  
- 🟠 Orange: Collaborative Mode
- 🟢 Green: Success/Output
- 🟡 Yellow: Processing/Conversation

**Shapes:**
- Rectangle: Process/Action
- Diamond: Decision Point
- Rounded Rectangle: Agent/Component
- Circle: Start/End Point
