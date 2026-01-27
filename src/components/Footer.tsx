import Link from "next/link";
import { Film } from "lucide-react";

export default function Footer() {
    return (
        <footer className="footer glass">
            <div className="footer-content">
                <div className="footer-top">
                    <Link href="/" className="logo">
                        <Film className="logo-icon" />
                        <span className="gradient-text">Moviefy</span>
                    </Link>
                    <p className="footer-tagline">Your Personal Cinema Universe</p>
                </div>

                <div className="footer-notice">
                    <h3>Important Notice</h3>
                    <p>
                        Moviefy does not host or store any media files. All content is sourced from third-party services and platforms.
                        We respect intellectual property rights and comply with DMCA regulations.
                    </p>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Moviefy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
