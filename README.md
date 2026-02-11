# 🤝 Lender Matching Platform

An intelligent, privacy-first FinTech bridge connecting lenders with commercial borrowers. This platform utilizes an advanced **Hybrid Gating & Scoring Engine** to match borrowers with credit policies extracted from lender guidelines (via PDF or manual input).

---

## 🚀 Key Features

* **Privacy-Centric Architecture:** Borrowers apply without seeing sensitive lender data. Lenders gain access to high-intent, qualified leads based on a proprietary matching score.
* **AI-Powered Policy Extraction:** Lenders can upload complex credit guideline PDFs. The system automatically extracts rules, criteria, and programs.
* **Standardized Field Mapping:** Uses a unified dropdown system (Industry Tiers, Equipment Types, etc.) to ensure high-fidelity matching.
* **Real-time Matching Engine:** Event-driven logic that triggers matches the moment a new application is submitted or a policy is updated.
* **Interactive Dashboard:** A clean, React-based portal for lenders to manage policies, view version history, and contact matched borrowers.

---

## 🧠 The Matching Logic: Multi-Factor Decay Model

This engine doesn't just "Filter", it **Evaluates**. While **Hard Constraints** act as binary knockouts, **Soft Constraints** use advanced mathematical decay functions to calculate a nuanced Match Score.

### 1. Hard Constraints (Knockout Phase)
If a lender marks a field as **Hard Bound (1)**, any borrower failing this criteria is immediately excluded. This ensures lenders only see leads that meet their absolute minimum standards.

### 2. Soft Constraints (Scoring Phase)
If a field is marked as **Soft Bound (0)**, a failure doesn't result in a knockout but triggers a specific mathematical decay:

#### A. Sigmoid Score Decay
Used for standard quantitative fields where being "near" the range is acceptable, but value decreases as the gap grows.
**Formula:**
$$S(x) = \frac{1}{1 + e^{-k(x - x_0)}}$$
*Where $k$ is the steepness and $x_0$ is the lender's threshold.*

#### B. Exponential Decay Score
Used for high-sensitivity terms like **Equipment Age** or **Years in Business**. The score drops sharply the further the borrower is from the ideal range.
**Formula:**
$$N(t) = N_0 e^{-\lambda t}$$
*Where $\lambda$ is the decay constant and $t$ is the variance from the limit.*

#### C. Hard Hit Score
Used for critical soft rules like **Loan Amount** or **NSF Counts**. If the borrower falls outside the soft range, the score for that term is instantly slashed to a fixed value (typically **50%–70%**).

#### D. Global Decay
If a borrower presents data points not explicitly desired by the lender (but not excluded), a flat **85% multiplier** is applied to ensure the match is ranked lower than "Perfect" fits.

---

## 🛠 Tech Stack

* **Frontend:** React.js, TypeScript, Tailwind CSS, Vite.
* **Backend:** FastAPI (Python), SQLAlchemy, Pydantic.
* **Database:** PostgreSQL with JSONB support for dynamic rules.
* **DevOps:** Docker, Docker Compose.
* **AI/OCR:** Gemini AI for PDF credit guideline extraction.

---

## 📥 Getting Started

### Prerequisites
* Docker and Docker Compose installed.
* Node.js (for local frontend development).
* add .env file, the structure of .env file is as follows
```
GEMINI_API_KEYS = *******
DATABASE_URL = postgresql://user:password@db:5432/lender_db
REDIS_URL = redis://cache:6379/0
SYSTEM_EMAIL=******
SYSTEM_EMAIL_PASSWORD=*******
```
For testing purposes, email and OTP services are disabled. You can enable them by uncommenting the relevant code in `lender_router.py`

### Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/lender-matching-platform.git](https://github.com/your-username/lender-matching-platform.git)
    cd lender-matching-platform
    ```

2.  **Run the Backend (Docker)**
    ```bash
    cd backend/
    docker compose up --build
    ```
    *The API will be available at `http://localhost:8000`*

3.  **Run the Frontend**
    ```bash
    cd ../lender-matching-frontend/
    npm install
    npx vite --force
    ```
    *The UI will be available at `http://localhost:5173`*

4. **Automatic Borrower Check**
   * You can directly run the script `backend\tests\test_borrower.py`, to fill the borrower's form. and you can also fill the borrower form by clicking on `look for lenders`.

---

## 🖥 User Workflows

### For Lenders
1.  **Register:** Provide your Industry and Email. (enter any random email for testing only)
2.  **Verify:** Enter the OTP sent to your email. (enter any random number for testing only)
3.  **Define Policy:** * Upload a PDF Guideline (extracted automatically).
    * **OR** Fill manually.
    * Mark fields as **Hard** (1) or **Soft** (0).
4.  **Manage:** View matched borrowers on your dashboard, see their contact info, and reach out via email.

### For Borrowers
1.  **Apply:** Click "Match Lenders" and fill out the equipment finance form.
2.  **Wait:** Your data is securely processed.
3.  **Connect:** Lenders who find your profile a high match will contact you directly via the email provided.

---

## 🗺 Roadmap

- [ ] **JWT Authentication:** Enhanced security for lender sessions.
- [ ] **Email Notifications:** Automated alerts when a "Perfect Match" is found.
- [ ] **Borrower Dashboard:** Allow borrowers to track how many lenders have viewed their profile.
- [ ] **Live Chat:** Secure messaging between lender and borrower once a connection is initiated.

