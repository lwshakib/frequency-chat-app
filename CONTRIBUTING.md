# Contributing to Frequency

First off, thanks for taking the time to contribute to the next generation of real-time communication! 🎉

The following is a set of guidelines for contributing to **Frequency**. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Check if the bug has already been reported in the issues.
- If not, use the **🐛 Bug Report** template to open an issue.
- Include clear steps to reproduce, expected behavior, and environment details.

### Suggesting Enhancements
- Open an issue using the **🚀 Feature Request** template to discuss the enhancement before starting work.
- Explain the reasoning behind the enhancement and how it benefits the Frequency community.

### Pull Requests
1.  **Fork** the repository.
2.  **Create a new branch** for your feature or bugfix (`git checkout -b feature/your-feature-name`).
3.  **Implement your changes**, ensuring you follow the project's premium design aesthetics.
4.  **Write Tests**: All new features MUST include unit tests (Jest for Web, Bun Test for Server). Significant UI flows should include Playwright E2E tests.
5.  **Run Quality Checks**: Ensure `bun run test` and `bun run format` pass in both the `server` and `web` directories.
6.  **Commit your changes** following the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat: login page with dark mode support`).
7.  **Push your branch** to your fork (`git push origin feature/your-feature-name`).
8.  **Open a Pull Request** against the `main` branch.

## 🛠️ Development Setup
Detailed instructions on setting up infrastructure (Docker, Bun, ENV) are provided in the [Root README](README.md).

## 🎨 Design & Code Standards
Frequency aims for a premium, high-performance experience.
- **UI Architecture**: Extend the design system using **Tailwind CSS** and **Radix UI** primitives. Avoid ad-hoc styling.
- **Code Consistency**: Use Prettier and ESLint (automatic checks run in CI). 
- **Type Safety**: Strictly adhere to TypeScript best practices—avoid `any` where possible.
- **Performance**: Optimize real-time events to minimize unnecessary rerenders in the Next.js frontend.

## 🤖 CI/CD Integration
Our GitHub Actions pipeline automatically validates every Pull Request for:
- 🟢 Code Formatting (Prettier)
- 🟢 Server API Tests (Bun Test)
- 🟢 Web Unit Tests (Jest)
- 🟢 Web E2E Tests (Playwright)

Ensure your checks are passing before requesting a review.

## 📜 License
By contributing, you agree that your contributions will be licensed under the MIT License.
