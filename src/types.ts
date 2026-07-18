export type TemplateType = "resume" | "business_letter" | "project_report";

export interface DocumentState {
  title: string;
  text: string;
  template: TemplateType;
  customInstruction: string;
  isImproving: boolean;
}

export const DEFAULT_TEMPLATES: Record<TemplateType, { title: string; text: string }> = {
  resume: {
    title: "Resume - Alex Carter",
    text: `# Alex Carter
Lead Software Engineer | alex.carter@email.com | (555) 019-2834 | San Francisco, CA | linkedin.com/in/alexcarter

## Professional Summary
Dynamic and results-driven Software Engineer with over 8 years of experience designing, building, and deploying scalable full-stack applications. Proven track record of leading cross-functional teams, optimizing database performance, and implementing robust CI/CD pipelines. Passionate about solving complex architectural problems and delivering high-quality, user-centric software solutions.

## Technical Skills
- **Languages:** TypeScript, JavaScript, Python, Go, SQL, HTML5, CSS3
- **Frameworks & Libraries:** React, Next.js, Node.js, Express, Tailwind CSS, GraphQL
- **Databases & Cloud:** PostgreSQL, Redis, MongoDB, AWS (S3, EC2, Lambda), Docker, Kubernetes
- **Tools & Methodologies:** Git, CI/CD (GitHub Actions), Agile/Scrum, Jest, Cypress

## Work Experience

### Lead Software Engineer | TechVanguard Solutions
*Jan 2023 - Present | San Francisco, CA*
- Spearheaded the migration of a legacy monolithic platform to a modern microservices architecture, improving system uptime to 99.99%.
- Led a team of 6 engineers to deliver a real-time data analytics dashboard using React, Node.js, and Redis, resulting in a 40% increase in user engagement.
- Spearheaded database optimization efforts for a primary PostgreSQL cluster, reducing query latency by 150ms and cutting server costs by 20%.
- Established modern testing practices (Jest, Cypress), raising overall test coverage from 35% to 85% and significantly reducing production bugs.

### Senior Full-Stack Engineer | Quantum Scale Corp
*Mar 2020 - Dec 2022 | Austin, TX*
- Designed and implemented 15+ secure RESTful and GraphQL APIs serving over 2 million active daily users.
- Developed an automated asset deployment system using AWS S3 and CloudFront, reducing assets loading time by 35% globally.
- Mentored 4 junior developers and established a rigorous peer code-review process, improving sprint delivery predictability by 15%.

## Education
### Bachelor of Science in Computer Science
*University of California, Berkeley | 2013 - 2017*
- Graduated with Honors (GPA: 3.85/4.00)
- Core coursework: Data Structures, Distributed Systems, Software Engineering, Database Management

## Certifications & Interests
- AWS Certified Solutions Architect (Associate)
- Open Source Contributor (React and Node ecosystems)
- Avid marathon runner and tech blogger
`,
  },
  business_letter: {
    title: "Business Letter - Strategic Partnership Proposal",
    text: `Alex Carter
VP of Partnerships
TechVanguard Solutions
100 Innovation Way
San Francisco, CA 94107
alex.carter@techvanguard.com

July 17, 2026

Sarah Jenkins
Chief Operating Officer
Quantum Scale Corp
500 Enterprise Blvd
Austin, TX 78701

Dear Ms. Jenkins,

Subject: Proposal for Strategic Integration and Partnership

I hope this letter finds you well. I am writing to formally propose a strategic partnership between Tech Vanguard Solutions and Quantum Scale Corp. Having closely followed Quantum Scale’s exceptional growth in enterprise data infrastructure, we believe that integrating our advanced real-time analytics module with your core database hosting platform would deliver immense value to both our client bases.

At TechVanguard, we specialize in lightning-fast telemetry visualization and predictive intelligence. By embedding our services directly within Quantum Scale’s cloud console, your enterprise customers will gain immediate, actionable insights into their data usage and application health. Preliminary analysis suggests this integration could reduce customer churn by up to 15% and increase average revenue per account (ARPU) by 22% within the first fiscal year.

We propose a brief, 30-minute introductory meeting next week to discuss this potential collaboration in more detail. Please let me know your availability on Tuesday, July 21, or Thursday, July 23, for a video conference.

Thank you for your time and consideration of this proposal. I look forward to the possibility of collaborating to redefine cloud performance metrics.

Sincerely,


Alex Carter
VP of Partnerships
TechVanguard Solutions
`,
  },
  project_report: {
    title: "Project Report - Q2 System Modernization",
    text: `# Project Report: Q2 System Modernization
**Status:** Completed | **Author:** Alex Carter (Lead Software Engineer) | **Date:** July 17, 2026

## 1. Abstract
This project report outlines the successful execution of the Q2 System Modernization Initiative at TechVanguard. The primary focus of this initiative was to refactor our aging core monolithic backend into a highly scalable, distributed microservices framework. Over twelve weeks, we successfully migrated core authentication, billing, and real-time telemetry modules. The resulting architecture achieved a 67% reduction in API response latency, raised system availability to 99.99%, and successfully lowered monthly cloud infrastructure expenditures by 22.4%.

## 2. Introduction
Our legacy monolithic platform, while functional during our initial growth phase, became a significant bottleneck for feature delivery and scale during early 2026. Deployments were risky, development cycles were slow due to tightly-coupled dependencies, and high-traffic periods led to resource starvation. To maintain our competitive edge and prepare for upcoming enterprise integrations, we launched the Q2 System Modernization Initiative. This document details the engineering specifications, architectural milestones, and outcomes of the refactoring project.

## 3. Objectives
The project was structured around three key objectives to guide the engineering squads:
- **Service Decoupling:** Extract the Billing and Analytics modules from the legacy monorepo into autonomous Node.js microservices.
- **Performance Enhancement:** Reduce global API response latency below 150ms by implementing high-performance Redis caching layers.
- **Reliability & Uptime:** Configure robust auto-scaling rules and containerize services using Docker and Kubernetes to guarantee a 99.99% service level objective (SLO).

## 4. Methodology
The modernization was executed in three distinct, phased intervals to prevent customer service disruption:
- **Phase I (Weeks 1-4):** Decoupled the Authentication service and instituted a federated OAuth flow. Fully containerized the new services using Docker.
- **Phase II (Weeks 5-8):** Built the Redis caching layer and optimized database read-heavy routes. Commenced pilot testing with 5% of production traffic.
- **Phase III (Weeks 9-12):** Migrated remaining telemetry services, updated CI/CD pipelines for automated blue-green deployments, and rolled out to 100% of users.

## 5. Conclusion
The Q2 System Modernization Initiative has achieved all of its core objectives on schedule. By transitioning from a monolithic to a microservices architecture, TechVanguard has resolved critical reliability issues, improved system performance, and established a modern, secure foundation. Our development velocity has increased by 35% now that teams can deploy independent modules autonomously. Future efforts will build upon this stable cloud-native foundation to expand our real-time messaging pipeline.
`,
  },
};
