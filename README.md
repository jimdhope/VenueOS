# VenueOS

VenueOS is a comprehensive content management and scheduling system designed for dynamic display across multiple screens and venues. It provides tools for managing media, creating playlists, scheduling content playback, and monitoring screen health, offering a flexible solution for digital signage and interactive installations.

## Features

*   **Content Management:** Upload, organize, and manage various media types (images, videos, etc.).
*   **Playlist Creation:** Assemble media into custom playlists for sequential or randomized playback.
*   **Advanced Scheduling:** Define intricate schedules for content to play on specific screens at designated times.
*   **Multi-Venue Support:** Manage content and screens across different physical venues.
*   **Screen Health Monitoring:** Keep track of the operational status of connected display screens.
*   **Timecode Synchronization:** Precise control over content playback and synchronization.
*   **Admin Interface:** A dedicated administrative panel for easy management of all aspects of the system.

## Technologies Used

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **Styling:** CSS Modules

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** v18.x or higher (LTS recommended)
*   **npm:** v9.x or higher (comes with Node.js)
*   **PostgreSQL:** A running PostgreSQL database instance.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/VenueOS.git
    cd VenueOS
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of your project. You'll need to populate it with your database connection string and any other necessary environment variables. A `.env.example` file is not provided, so you'll need to create this manually.

    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/your_database_name"
    # Add any other environment variables required by your application
    ```
    *Replace `user`, `password`, `localhost:5432`, and `your_database_name` with your PostgreSQL database credentials.*

4.  **Database Setup:**

    Apply Prisma migrations and seed the database:

    ```bash
    npx prisma migrate dev --name init # You might want to use a more descriptive name than 'init'
    npx prisma db seed
    ```

### Running the Development Server

To start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application. The page will hot-reload as you make changes.

## Usage

Once the application is running, navigate to the `/admin` route (e.g., `http://localhost:3000/admin`) to access the administrative interface. From there, you can:

*   Manage venues, screens, and spaces.
*   Upload and organize content.
*   Create and edit playlists.
*   Set up and manage content schedules.
*   Monitor screen diagnostics.

## Project Structure

```
.
├── prisma/           # Prisma schema, migrations, and seed data
├── public/           # Static assets (images, fonts, etc.)
└── src/
    ├── app/          # Next.js App Router: pages, API routes, and layouts
    │   ├── admin/    # Admin panel routes and components
    │   ├── api/      # API endpoints
    │   └── play/     # Public-facing screen playback routes
    ├── components/   # Reusable React components
    └── lib/          # Utility functions, database client, and helpers
```

## Contributing

We welcome contributions to VenueOS! To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3.  Make your changes and ensure they adhere to the project's coding style.
4.  Write clear, concise commit messages.
5.  Push your branch to your fork.
6.  Open a Pull Request to the `main` branch of the original repository, describing your changes in detail.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please open an issue on the GitHub repository.