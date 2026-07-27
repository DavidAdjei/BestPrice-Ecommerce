import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import InfoIcon from "@mui/icons-material/Info";
import ReviewsIcon from "@mui/icons-material/Reviews";
import EmailIcon from "@mui/icons-material/Email";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useAuthStore } from "../store/authStore";
import Logo from "../assets/images/Logo.jpeg";

const navLinkClass = "text-sm text-[#b7bdca] transition-colors hover:text-primary";

export function Footer() {
  const isAuth = useAuthStore((state) => state.isAuth);
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-secondary text-[#e7e9ee]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 pt-14 pb-8 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-full flex flex-col gap-4 pr-5 md:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-white">
            <img src={Logo} alt="Best Price" className="h-8 w-8 rounded-full object-cover" />
            <span>Best Price</span>
          </Link>
          <p className="max-w-[30ch] text-sm leading-relaxed text-[#b7bdca]">
            A marketplace connecting buyers and sellers with great deals,
            secure payments and support every step of the way.
          </p>
          <div className="flex gap-3">
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[#b7bdca] hover:text-primary">
              <LinkedInIcon />
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-[#b7bdca] hover:text-primary">
              <TwitterIcon />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#b7bdca] hover:text-primary">
              <InstagramIcon />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold tracking-wide text-white uppercase">Pages</p>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center gap-2">
              <HomeIcon sx={{ fontSize: 18, color: "#7d8496" }} />
              <Link to="/" className={navLinkClass}>Home</Link>
            </li>
            <li className="flex items-center gap-2">
              <StoreIcon sx={{ fontSize: 18, color: "#7d8496" }} />
              <Link to="/shop" className={navLinkClass}>Shop</Link>
            </li>
            {!isAuth && (
              <li className="flex items-center gap-2">
                <PersonAddIcon sx={{ fontSize: 18, color: "#7d8496" }} />
                <Link to="/signup" className={navLinkClass}>Sign Up</Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold tracking-wide text-white uppercase">Company</p>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center gap-2">
              <InfoIcon sx={{ fontSize: 18, color: "#7d8496" }} />
              <Link to="/about" className={navLinkClass}>About Us</Link>
            </li>
            <li className="flex items-center gap-2">
              <ReviewsIcon sx={{ fontSize: 18, color: "#7d8496" }} />
              <span className={navLinkClass}>Testimonials</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold tracking-wide text-white uppercase">Get in touch</p>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center gap-2">
              <EmailIcon sx={{ fontSize: 18, color: "#7d8496" }} />
              <a href="mailto:support@bestprice.com" className={navLinkClass}>
                support@bestprice.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-[#7d8496]">
        <p>&copy; {year} Best Price. All rights reserved.</p>
      </div>
    </footer>
  );
}
