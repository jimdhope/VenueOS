import Image from "next/image";
import styles from "./page.module.css"; // Assuming some basic styles might be useful, or I'll define new ones.

export default function Home() {
  return (
    <div className={styles.container}> {/* Use a container for overall layout */}
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>VenueOS</h1>
        <p className={styles.heroTagline}>Dynamic Content Management for Modern Venues</p>
        <p className={styles.heroDescription}>
          VenueOS is a comprehensive content management and scheduling system designed for dynamic display across multiple screens and venues. It provides tools for managing media, creating playlists, scheduling content playback, and monitoring screen health, offering a flexible solution for digital signage and interactive installations.
        </p>
        <a href="#features" className={styles.callToAction}>Learn More</a>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Key Features</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/content-management.svg" alt="Content Management Icon" width={64} height={64} />
            <h3>Content Management</h3>
            <p>Upload, organize, and manage various media types (images, videos, etc.).</p>
          </div>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/playlist.svg" alt="Playlist Creation Icon" width={64} height={64} />
            <h3>Playlist Creation</h3>
            <p>Assemble media into custom playlists for sequential or randomized playback.</p>
          </div>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/Scheduling.svg" alt="Advanced Scheduling Icon" width={64} height={64} />
            <h3>Advanced Scheduling</h3>
            <p>Define intricate schedules for content to play on specific screens at designated times.</p>
          </div>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/multi-venue.svg" alt="Multi-Venue Support Icon" width={64} height={64} />
            <h3>Multi-Venue Support</h3>
            <p>Manage content and screens across different physical venues.</p>
          </div>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/health.svg" alt="Screen Health Monitoring Icon" width={64} height={64} />
            <h3>Screen Health Monitoring</h3>
            <p>Keep track of the operational status of connected display screens.</p>
          </div>
          <div className={styles.featureItem}>
            {/* Placeholder for icon */}
            <Image src="/time.svg" alt="Timecode Synchronization Icon" width={64} height={64} /> {/* Reusing window.svg as a placeholder */}
            <h3>Timecode Synchronization</h3>
            <p>Precise control over content playback and synchronization.</p>
          </div>
        </div>
      </section>

      {/* Call to Action / Contact Section */}
      <section className={styles.callToActionSection}>
        <h2 className={styles.sectionTitle}>Ready to Transform Your Venue?</h2>
        <p>
          VenueOS offers a powerful and flexible solution for all your digital signage needs.
          Contact us to learn more or explore the possibilities.
        </p>
        <a href="https://github.com/your-username/VenueOS" target="_blank" rel="noopener noreferrer" className={styles.callToAction}>
          View on GitHub
        </a>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 James Hope. All rights reserved.</p>
      </footer>
    </div>
  );
}