# GigSync: Security & Privacy

Your trust is the foundation of our service. This document outlines our commitment to securing your data and respecting your privacy. We've designed GigSync from the ground up to be a powerful co-pilot that works for you, without compromising your account safety or personal information.

---

### How GigSync Works: No Scraping, No Automation

A core principle of GigSync is that we **do not** interact directly with delivery platform apps like DoorDash, Uber Eats, or GrubHub.

-   **🚫 No Direct API Usage:** We do not use any official or unofficial APIs from delivery platforms. This avoids the risk of violating their terms of service, which could jeopardize your driver account.
-   **🚫 No Automation or Scraping:** Our application does not "scrape" your screen, automate accept/decline decisions, or perform any actions on your behalf within other apps.
-   **✅ Human-in-the-Loop:** You, the driver, are always in control. The app's core functionality is initiated when **you** take a screenshot of an offer and choose to share it with the GigSync assistant for analysis.

### AI and Order Information

When you provide a screenshot of an offer, our AI service processes that image to extract key information.

-   **What the AI Sees:** The AI (powered by Google Gemini) "reads" the image to identify details like restaurant name, payout, distance, and delivery location.
-   **Purpose of Analysis:** This information is used solely to calculate the `profitScore` and provide you with an instant analysis to help you make a more informed decision. The AI does not store the image long-term and does not have access to any other part of your device or other apps.

### Data Security Practices

We employ industry-standard security measures to protect your information.

-   **Data Encryption:** All communication between your device and our servers is encrypted using HTTPS/TLS. Sensitive data stored in our database (as outlined in `db/schema.sql`) is also encrypted at rest.
-   **Secure API Key Handling:** The `API_KEY` for the Gemini AI service is managed securely on our backend servers. It is never exposed in the client-side application that runs on your device.
-   **Secure Authentication:** User accounts are protected with modern password hashing algorithms to ensure your credentials remain secure.

### User Privacy Commitment

Your data belongs to you. Our use of it is limited to providing and improving the GigSync service.

-   **Confidentiality:** Your individual earnings data, shift history, and performance metrics are considered confidential.
-   **No Selling of Data:** We will never sell your personal or operational data to third parties.
-   **Anonymized Aggregates:** To power future features like "Predictive Hotspots," we may analyze anonymized and aggregated data from many drivers. This data will be stripped of all personal identifiers, ensuring that individual privacy is protected while contributing to insights that benefit the entire driver community.

If you have any further questions about our security or privacy practices, please do not hesitate to reach out.
