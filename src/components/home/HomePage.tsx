import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  MoreVertical,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
  Video,
  Wallet,
  X
} from 'lucide-react';
import { DropNestLogo } from '../common/DropNestLogo.tsx';
import { ApiService } from '../../services/api.ts';
import type { CompanyInfo, HomepageCMS, TutorialVideo, UserRole } from '../../types/platform.ts';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshLocations.ts';
import { formatBDT, formatBangladeshDateTime } from '../../utils/formatters.ts';
import { RegisterModal } from '../auth/RegisterModal.tsx';

interface HomePageProps {
  onNavigateToLogin: (role?: UserRole | 'GENERAL') => void;
  currentUser?: any;
  onNavigateToDashboard?: () => void;
}

// Blog Articles Dataset for Bangladesh Dropshipping
const BLOG_POSTS = [
  {
    id: 'blog-1',
    title: 'How to Build a ৳50,000+ Monthly Dropshipping Business in Bangladesh with Zero Capital',
    author: 'DropNest Growth Team',
    date: 'October 2026',
    category: 'Reseller Strategy',
    readTime: '6 min read',
    excerpt: 'A comprehensive step-by-step blueprint on sourcing verified Bangladeshi factory goods, setting profitable markups, and running viral campaigns on Facebook and TikTok.',
    content: `Dropshipping in Bangladesh has entered a golden era. Unlike international AliExpress dropshipping that suffered from 3-week shipping delays and foreign exchange card restrictions, domestic dropshipping through DropNest empowers Bangladeshi merchants with 24 to 48-hour Cash On Delivery (COD) across all 64 districts.\n\n### Step 1: Select High-Demand Lifestyle & Household Niches\nBangladeshi consumers heavily purchase high-utility kitchen organizers, authentic leather accessories, women's apparel, organic beauty products, and everyday electronics. Choose 5 to 10 products with healthy margins (minimum ৳300 to ৳500 profit per unit).\n\n### Step 2: Set Competitive Retail Markups\nWholesale prices listed on DropNest are direct factory costs. For example, if a premium waterproof travel bag is listed at ৳450 wholesale, you can comfortably retail it at ৳850 to ৳950 with free delivery inside Dhaka. The customer pays cash upon delivery, and your profit is automatically credited to your wallet.\n\n### Step 3: Optimize Order Confirmation via Phone Call\nIn Bangladesh, COD success jumps from 68% to 92% when resellers place a quick 45-second verification call to confirm customer address, phone number, and color preference before booking with Steadfast Courier.\n\n### Step 4: Daily Profit Withdrawals\nWithdraw your earnings daily directly into your personal bKash, Nagad, or Bank account with zero withdrawal delays.`
  },
  {
    id: 'blog-2',
    title: 'Steadfast vs RedX: Courier Strategies for Maximizing COD Delivery Rates in 64 Districts',
    author: 'Logistics Architecture Desk',
    date: 'October 2026',
    category: 'Fulfillment & Logistics',
    readTime: '5 min read',
    excerpt: 'Detailed analysis of parcel transit times, upazila hub coverage, return percentage reduction, and automated webhook tracking in Bangladesh.',
    content: `Cash On Delivery remains the primary payment method for 85%+ of Bangladesh e-commerce orders. Choosing and configuring the right courier sync through DropNest is essential to protect your profit margins.\n\n### 1. Delivery Transit Comparisons\nInside Dhaka Metropolitan Area, both Steadfast and RedX deliver within 24 hours. For outside Dhaka and remote divisional upazilas (such as Sunamganj, Rangamati, or Thakurgaon), transit times average 48 to 72 hours.\n\n### 2. Standardized Delivery Fees\n- Inside Dhaka: ৳60 BDT\n- Dhaka Suburbs & Outside Dhaka: ৳120 BDT\nDropNest automatically calculates these rates during parcel creation, so your profit calculations are exact.\n\n### 3. Preventing Customer Refusals (Returns)\nEvery returned parcel incurs shipping costs. DropNest's automated SMS updates send parcel tracking links and delivery day alerts to the buyer, keeping them prepared with cash at the time of delivery.`
  },
  {
    id: 'blog-3',
    title: 'Top 10 High-Margin Winning Product Categories in Bangladesh for 2026',
    author: 'Merchant Advisory Council',
    date: 'October 2026',
    category: 'Product Sourcing',
    readTime: '4 min read',
    excerpt: 'Discover which local factory goods are generating the highest volume and profit margins for digital retailers this season.',
    content: `Product research is the cornerstone of successful e-commerce. Here are the top performers on the DropNest platform:\n\n1. **Smart Home & Kitchen Gadgets**: High perceived value, compact packaging, low transit damage risk.\n2. **Handcrafted Leather Goods**: Bangladesh leather has world-class appeal. Belts, wallets, and laptop bags easily support 60%+ markups.\n3. **Seasonal Apparel**: Winter jackets, modest fashion, and formal kurtis with vibrant Bangladeshi craftsmanship.\n4. **Baby Care & Child Safety**: Parents prioritize quality; repeat order rate is exceptionally high.\n5. **Personal Grooming & Electronics**: Trimmers, hair styling brushes, and USB gadgets with universal demand.`
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToLogin,
  currentUser,
  onNavigateToDashboard,
}) => {
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [tutorials, setTutorials] = useState<TutorialVideo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // A1. Three-Dot / Menu Drawer State
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // A2. Reseller Registration Modal ("Join Up") State
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Portal Switcher Dropdown in Navigation
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  // Modal Views for specific Navigation / Legal pages
  const [activeModal, setActiveModal] = useState<
    'ABOUT' | 'BLOG' | 'INFORMATION' | 'CONTACT' | 'COMMUNITY' | 'SUPPORT' | 'TERMS' | 'PRIVACY' | 'REFUND' | 'SHIPPING' | null
  >(null);

  // Active Blog Article Reader Modal
  const [selectedBlog, setSelectedBlog] = useState<typeof BLOG_POSTS[0] | null>(null);

  // Video Tutorial Modal
  const [activeVideoModal, setActiveVideoModal] = useState<TutorialVideo | null>(null);

  // Active Tutorial Category Filter
  const [tutCategory, setTutCategory] = useState<string>('ALL');

  // Interactive 64 Districts Coverage Checker State
  const [selectedDistrictName, setSelectedDistrictName] = useState('Dhaka');
  const selectedDistrictData = BANGLADESH_DISTRICTS.find(
    (d) => d.name.toLowerCase() === selectedDistrictName.toLowerCase()
  ) || BANGLADESH_DISTRICTS[0];

  // Interactive Reseller Profit Calculator State
  const [dailyOrders, setDailyOrders] = useState<number>(10);
  const [profitPerOrder, setProfitPerOrder] = useState<number>(350);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Reseller Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const data = await ApiService.getPublicHomeData();
        setCms(data.cms);
        setCompany(data.company);
        setTutorials(data.tutorials || []);
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load public home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Calculated Profit
  const monthlyOrders = dailyOrders * 30;
  const monthlyProfit = monthlyOrders * profitPerOrder;
  const yearlyProfit = monthlyProfit * 12;

  // Filtered tutorials
  const filteredTutorials = tutorials.filter((t) => {
    if (tutCategory === 'ALL') return true;
    return t.category === tutCategory;
  });

  // Handle Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);
    if (!contactName.trim() || !contactMobile.trim() || !contactMessage.trim()) {
      setContactFeedback({ type: 'error', text: 'Please fill in your name, mobile number, and message.' });
      return;
    }

    setContactSubmitting(true);
    try {
      const res = await ApiService.submitContactForm({
        name: contactName.trim(),
        mobile: contactMobile.trim(),
        email: contactEmail.trim(),
        subject: contactSubject,
        message: contactMessage.trim(),
      });
      setContactFeedback({ type: 'success', text: res.message });
      setContactName('');
      setContactMobile('');
      setContactEmail('');
      setContactMessage('');
    } catch (err: any) {
      setContactFeedback({ type: 'error', text: err.message || 'Failed to submit message. Please try again.' });
    } finally {
      setContactSubmitting(false);
    }
  };

  // Quick navigation helper to close drawer and scroll/open modal
  const handleNavAction = (target: string) => {
    setMenuDrawerOpen(false);
    if (target === 'HOME') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'ABOUT') {
      setActiveModal('ABOUT');
    } else if (target === 'BLOG') {
      const el = document.getElementById('blog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else setActiveModal('BLOG');
    } else if (target === 'TUTORIALS') {
      const el = document.getElementById('tutorials');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'INFORMATION') {
      setActiveModal('INFORMATION');
    } else if (target === 'CONTACT') {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else setActiveModal('CONTACT');
    } else if (target === 'FEATURES') {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'COMMUNITY') {
      setActiveModal('COMMUNITY');
    } else if (target === 'SUPPORT') {
      setActiveModal('SUPPORT');
    } else if (target === 'FAQ') {
      const el = document.getElementById('faq');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'TERMS') {
      setActiveModal('TERMS');
    } else if (target === 'PRIVACY') {
      setActiveModal('PRIVACY');
    } else if (target === 'REFUND') {
      setActiveModal('REFUND');
    } else if (target === 'SHIPPING') {
      setActiveModal('SHIPPING');
    }
  };

  // Draft Contact Details fallback
  const displayPhone = company?.supportMobile || '+88 01893-665896';
  const displayEmail = company?.officialEmail || 'Dropnestbd@gamil.com';
  const displayWebsite = company?.websiteUrl || 'Dropnest.com.bd';

  return (
    <div className="min-h-screen bg-[#080611] text-white flex flex-col selection:bg-[#7C3AED]/30 font-sans">

      {/* Logged in notification banner if authenticated */}
      {currentUser && (
        <div className="bg-[#7C3AED]/20 border-b border-[#7C3AED]/40 px-4 py-2 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span>Signed in as <strong className="text-white">{currentUser.fullName}</strong> (<span className="text-[#A855F7] font-bold">{currentUser.role}</span>)</span>
            </div>
            <button
              onClick={onNavigateToDashboard}
              className="px-3 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Return to My Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Persistent Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#080611]/95 backdrop-blur-md border-b border-[#302741] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left Side: Three-Dot / ||| Menu Icon & DropNest Branding */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* A1. Three-Dot Menu (Icon labelled ||| or Three-Dots) */}
            <button
              type="button"
              onClick={() => setMenuDrawerOpen(true)}
              className="p-2 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#7C3AED] text-[#C9C4D6] hover:text-white flex items-center justify-center transition-colors shadow-sm"
              title="Open Navigation Menu"
              aria-label="Navigation Menu"
            >
              <div className="flex items-center gap-0.5 tracking-tighter text-[#A855F7] font-bold text-sm px-0.5 select-none font-mono">
                <span>|</span>
                <span>|</span>
                <span>|</span>
              </div>
            </button>

            {/* Official Brand Logo & Name */}
            <a href="/" className="flex items-center gap-2">
              <DropNestLogo size="md" />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-[#C9C4D6]">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#coverage" className="hover:text-white transition-colors">
                64 Districts COD
              </a>
              <a href="#calculator" className="hover:text-white transition-colors">
                Profit Calculator
              </a>
              <a href="#tutorials" className="hover:text-white transition-colors">
                Tutorials
              </a>
              <a href="#blog" className="hover:text-white transition-colors">
                Blog
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </nav>
          </div>

          {/* Right Side: A2. Login and Join Up Buttons (Reseller Login and Registration) */}
          <div className="flex items-center gap-2">
            {/* Quick Role Portal Switcher */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-[#171226] border border-[#302741] text-[#C9C4D6] hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Authorized Consoles</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#A855F7]" />
              </button>

              {portalMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#171226] border border-[#302741] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-xs"
                  onClick={() => setPortalMenuOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#C9C4D6]/60 uppercase tracking-wider">
                    Role-Based Consoles
                  </div>
                  <button
                    onClick={() => onNavigateToLogin('RESELLER')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#100D1B] flex items-center justify-between text-white"
                  >
                    <span>Reseller Panel</span>
                    <span className="text-[10px] font-mono text-[#A855F7]">MERCHANT</span>
                  </button>
                  <button
                    onClick={() => onNavigateToLogin('SUPPLIER')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#100D1B] flex items-center justify-between text-white"
                  >
                    <span>Supplier Panel</span>
                    <span className="text-[10px] font-mono text-[#FBBF24]">FACTORY</span>
                  </button>
                  <button
                    onClick={() => onNavigateToLogin('MODERATOR')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#100D1B] flex items-center justify-between text-white"
                  >
                    <span>Moderator Panel</span>
                    <span className="text-[10px] font-mono text-[#22D3EE]">COMPLIANCE</span>
                  </button>
                  <button
                    onClick={() => onNavigateToLogin('ADMIN')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#100D1B] flex items-center justify-between text-white"
                  >
                    <span>Admin Panel</span>
                    <span className="text-[10px] font-mono text-[#34D399]">OPERATIONS</span>
                  </button>
                  <button
                    onClick={() => onNavigateToLogin('SUPER_ADMIN')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#100D1B] flex items-center justify-between text-white border-t border-[#302741] pt-1.5"
                  >
                    <span className="text-[#EC4899] font-bold">Super Admin Panel</span>
                    <span className="text-[10px] font-mono text-[#EC4899]">SOVEREIGN</span>
                  </button>
                </div>
              )}
            </div>

            {/* A2. Login Button: opens Reseller Login */}
            <button
              onClick={() => onNavigateToLogin('RESELLER')}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#171226] border border-[#7C3AED]/50 hover:border-[#7C3AED] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Reseller Account Login"
            >
              <Lock className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Login</span>
            </button>

            {/* A2. Join Up Button: opens Reseller Registration system */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 flex items-center gap-1.5"
              title="Join Up as Reseller"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Join Up</span>
            </button>
          </div>
        </div>
      </header>

      {/* A1. Slide-out Drawer Menu triggered by ||| or Three-Dot button */}
      {menuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-0 w-full max-w-sm bg-[#100D1B] border-r border-[#302741] h-full overflow-y-auto flex flex-col p-5 shadow-2xl z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#302741] pb-4">
              <div className="flex items-center gap-2">
                <DropNestLogo size="sm" />
              </div>
              <button
                onClick={() => setMenuDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-[#171226] border border-[#302741] text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Required Navigation Items:
                Home, About Us, Blog, Tutorials, Information, Contact, Features, Community */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#A855F7] uppercase tracking-wider px-3 py-1 font-mono">
                Website Navigation
              </div>

              <button
                onClick={() => handleNavAction('HOME')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Globe className="w-4 h-4 text-[#22D3EE]" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavAction('ABOUT')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Building2 className="w-4 h-4 text-[#A855F7]" />
                <span>About Us</span>
              </button>

              <button
                onClick={() => handleNavAction('BLOG')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#FBBF24]" />
                <span>Blog & BD Guides</span>
              </button>

              <button
                onClick={() => handleNavAction('TUTORIALS')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Video className="w-4 h-4 text-[#EC4899]" />
                <span>Tutorials</span>
              </button>

              <button
                onClick={() => handleNavAction('INFORMATION')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Info className="w-4 h-4 text-[#34D399]" />
                <span>Information & Standards</span>
              </button>

              <button
                onClick={() => handleNavAction('CONTACT')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#22D3EE]" />
                <span>Contact Us</span>
              </button>

              <button
                onClick={() => handleNavAction('FEATURES')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                <span>Features</span>
              </button>

              <button
                onClick={() => handleNavAction('COMMUNITY')}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#171226] text-white text-xs font-semibold flex items-center gap-3 transition-colors"
              >
                <Users className="w-4 h-4 text-[#EC4899]" />
                <span>Reseller Community</span>
              </button>
            </div>

            {/* A3. Additional Navigation Links */}
            <div className="space-y-1 border-t border-[#302741] pt-4">
              <div className="text-[10px] font-bold text-[#C9C4D6]/70 uppercase tracking-wider px-3 py-1 font-mono">
                Additional Services & Support
              </div>

              <button
                onClick={() => {
                  setMenuDrawerOpen(false);
                  onNavigateToLogin('RESELLER');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#171226] text-white text-xs font-medium flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Dropshipper Login</span>
                </span>
                <span className="text-[10px] text-[#A855F7] font-mono">PORTAL</span>
              </button>

              <button
                onClick={() => handleNavAction('SUPPORT')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#171226] text-white text-xs font-medium flex items-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Support Centre</span>
              </button>

              <button
                onClick={() => handleNavAction('FAQ')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#171226] text-white text-xs font-medium flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>FAQ</span>
              </button>
            </div>

            {/* Policy & Legal Links */}
            <div className="space-y-1 border-t border-[#302741] pt-4">
              <div className="text-[10px] font-bold text-[#C9C4D6]/70 uppercase tracking-wider px-3 py-1 font-mono">
                Legal & Governance
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-[#C9C4D6]">
                <button
                  onClick={() => handleNavAction('TERMS')}
                  className="text-left px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Terms & Conditions
                </button>
                <button
                  onClick={() => handleNavAction('PRIVACY')}
                  className="text-left px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => handleNavAction('REFUND')}
                  className="text-left px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Refund Policy
                </button>
                <button
                  onClick={() => handleNavAction('SHIPPING')}
                  className="text-left px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Shipping Policy
                </button>
              </div>
            </div>

            {/* Drawer Footer Account CTA */}
            <div className="mt-auto border-t border-[#302741] pt-4 space-y-2">
              <button
                onClick={() => {
                  setMenuDrawerOpen(false);
                  setShowRegisterModal(true);
                }}
                className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                <span>Join Up as Reseller Free</span>
              </button>

              <div className="text-[10px] text-center text-[#C9C4D6]">
                Hotline: <span className="font-mono text-[#22D3EE]">{displayPhone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hero Section with Bangladesh Analytics Matrix Background */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-[#302741]">
        {/* Background Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20"
          style={{ backgroundImage: "url('/Image/Dashboard Background.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080611]/80 via-[#080611] to-[#080611] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Top Sovereign Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A855F7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>The Premier Bangladesh Dropshipping & Reseller Infrastructure</span>
          </div>

          {/* Dynamic Headline from CMS */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {cms?.bannerHeadline || 'Start Your Dropshipping Business in Bangladesh with Zero Inventory'}
          </h1>

          {/* Dynamic Description from CMS */}
          <p className="text-sm sm:text-base text-[#C9C4D6] max-w-3xl mx-auto leading-relaxed">
            {cms?.homeDescription ||
              'Connect directly with verified wholesale factory suppliers across Bangladesh. Set your own selling prices, dispatch via automated Cash On Delivery couriers to all 64 districts, and withdraw your profit margins daily to bKash & Nagad.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#7C3AED]/20 flex items-center gap-2"
            >
              <span>{cms?.bannerButtonText || 'Join Up (0 Tk Capital)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToLogin('RESELLER')}
              className="px-6 py-3 bg-[#171226] border border-[#7C3AED]/50 hover:border-[#7C3AED] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-[#A855F7]" />
              <span>Reseller Login</span>
            </button>

            <button
              onClick={() => onNavigateToLogin('SUPPLIER')}
              className="px-5 py-3 bg-[#171226] border border-[#302741] hover:border-[#FBBF24] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Boxes className="w-4 h-4 text-[#FBBF24]" />
              <span>Supplier Portal</span>
            </button>
          </div>

          {/* 4 Trust Markers */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 bg-[#171226]/80 border border-[#302741] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[#22D3EE] font-bold text-xs">
                <MapPin className="w-4 h-4" />
                <span>64 Districts COD</span>
              </div>
              <p className="text-[11px] text-[#C9C4D6]">Every upazila connected with doorstep cash collection.</p>
            </div>

            <div className="p-3.5 bg-[#171226]/80 border border-[#302741] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[#34D399] font-bold text-xs">
                <Wallet className="w-4 h-4" />
                <span>Instant Daily Payouts</span>
              </div>
              <p className="text-[11px] text-[#C9C4D6]">Withdraw profit margins directly to bKash, Nagad, or Bank.</p>
            </div>

            <div className="p-3.5 bg-[#171226]/80 border border-[#302741] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[#A855F7] font-bold text-xs">
                <Truck className="w-4 h-4" />
                <span>Steadfast & RedX Sync</span>
              </div>
              <p className="text-[11px] text-[#C9C4D6]">Automated API dispatch with 17 real-time tracking states.</p>
            </div>

            <div className="p-3.5 bg-[#171226]/80 border border-[#302741] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[#EC4899] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>0 Tk Stock Risk</span>
              </div>
              <p className="text-[11px] text-[#C9C4D6]">You sell first, wholesale factories pack and ship for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dual Value Proposition Section (Resellers vs Factory Suppliers) */}
      <section id="features" className="py-16 bg-[#100D1B] border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Engineered for Both Resellers & Wholesale Factories
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              A complete Bangladesh e-commerce ecosystem aligning supply factory volume with merchant sales forces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Resellers Card */}
            <div className="bg-[#171226] border border-[#7C3AED]/40 p-6 sm:p-8 rounded-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A855F7]">
                  <Store className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#A855F7] text-xs font-bold font-mono">
                  FOR RESELLERS
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Sell Products Online with 0 Tk Upfront Investment
                </h3>
                <p className="text-xs text-[#C9C4D6] mt-1 leading-relaxed">
                  Start your e-commerce journey on Facebook, TikTok, Daraz, or your personal shop without buying bulk stock.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-[#C9C4D6]">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Access wholesale factory prices directly from verified Bangladesh manufacturers.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Set your own retail selling price and keep 100% of your chosen profit margin.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>No packing or courier line queues — supplier factories pack with your brand name.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Doorstep COD delivery across all 64 districts via Steadfast and RedX couriers.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Reseller Account Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* For Factory Suppliers Card */}
            <div className="bg-[#171226] border border-[#FBBF24]/40 p-6 sm:p-8 rounded-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24]">
                  <Boxes className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] text-xs font-bold font-mono">
                  FOR SUPPLIERS & FACTORIES
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Scale Your Manufacturing Volume with 10,000+ Resellers
                </h3>
                <p className="text-xs text-[#C9C4D6] mt-1 leading-relaxed">
                  List your inventory once and let our nationwide network of motivated digital sellers drive daily wholesale orders.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-[#C9C4D6]">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Zero marketing overhead or ad spend — our digital reseller force drives the demand.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Bulk volume order creation directly synced to your supplier dashboard.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Automated courier hub pickup directly from your factory or warehouse.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span>Guaranteed payment settlements with full ledger transparency in BDT.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateToLogin('SUPPLIER')}
                  className="w-full py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-black text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>Apply as Factory Supplier</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How DropNest Works (Step-by-Step Flow) */}
      <section id="how-it-works" className="py-16 border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
              Seamless 4-Stage Operational Model
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              How DropNest Delivers Across Bangladesh
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              From supplier factory warehouse to customer doorstep in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3 relative">
              <span className="text-2xl font-bold font-mono text-[#7C3AED]">01</span>
              <h4 className="text-sm font-bold text-white">Wholesale Catalog Listed</h4>
              <p className="text-xs text-[#C9C4D6] leading-relaxed">
                Verified Bangladeshi factories list products with factory-direct BDT wholesale pricing and high-res photos.
              </p>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3 relative">
              <span className="text-2xl font-bold font-mono text-[#A855F7]">02</span>
              <h4 className="text-sm font-bold text-white">Resellers Market & Set Price</h4>
              <p className="text-xs text-[#C9C4D6] leading-relaxed">
                Resellers download images, determine their retail selling markup, and market products on social media.
              </p>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3 relative">
              <span className="text-2xl font-bold font-mono text-[#22D3EE]">03</span>
              <h4 className="text-sm font-bold text-white">Automated COD Dispatch</h4>
              <p className="text-xs text-[#C9C4D6] leading-relaxed">
                Reseller submits order; factory packs and Steadfast/RedX courier delivers COD to any of Bangladesh's 64 districts.
              </p>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3 relative">
              <span className="text-2xl font-bold font-mono text-[#34D399]">04</span>
              <h4 className="text-sm font-bold text-white">Profit Withdrawn Daily</h4>
              <p className="text-xs text-[#C9C4D6] leading-relaxed">
                Customer pays cash at doorstep. The wholesale cost goes to supplier, and the profit margin goes into reseller's wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive 64 Bangladesh Districts Coverage & COD Hub Checker */}
      <section id="coverage" className="py-16 bg-[#100D1B] border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#34D399] uppercase tracking-wider">
              National Delivery Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Coverage Across All 64 Districts & 490+ Upazilas
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              Select any district in Bangladesh to check transit times, standard COD delivery rates, and courier hubs.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-[#171226] border border-[#302741] p-6 rounded-2xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white mb-2">
                Select Operating Bangladesh District
              </label>
              <select
                value={selectedDistrictName}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#7C3AED] rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none"
              >
                {BANGLADESH_DISTRICTS.map((dist) => (
                  <option key={dist.id} value={dist.name}>
                    {dist.name} (Division: {dist.division}) — {dist.upazilas.length} Upazilas
                  </option>
                ))}
              </select>
            </div>

            {/* District Specs Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1">
                <span className="text-[#C9C4D6] text-[11px]">Division:</span>
                <div className="font-bold text-white">{selectedDistrictData.division}</div>
              </div>

              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1">
                <span className="text-[#C9C4D6] text-[11px]">Upazilas Connected:</span>
                <div className="font-bold text-[#22D3EE] font-mono">{selectedDistrictData.upazilas.length} Upazilas</div>
              </div>

              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1">
                <span className="text-[#C9C4D6] text-[11px]">COD Delivery Fee:</span>
                <div className="font-bold text-[#34D399] font-mono">
                  {selectedDistrictData.name === 'Dhaka' ? '৳ 60 BDT' : '৳ 120 BDT'}
                </div>
              </div>

              <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1">
                <span className="text-[#C9C4D6] text-[11px]">Doorstep Transit:</span>
                <div className="font-bold text-[#FBBF24] font-mono">
                  {selectedDistrictData.name === 'Dhaka' ? '24 Hours' : '48 Hours'}
                </div>
              </div>
            </div>

            {/* Sample Upazilas list */}
            <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider text-[#A855F7]">
                Serviceable Upazilas in {selectedDistrictData.name}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedDistrictData.upazilas.map((u) => (
                  <span
                    key={u}
                    className="px-2 py-0.5 rounded bg-[#171226] border border-[#302741] text-[11px] text-[#C9C4D6]"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Interactive Reseller Profit Calculator */}
      <section id="calculator" className="py-16 border-b border-[#302741]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold text-[#EC4899] uppercase tracking-wider">
              Financial Simulator
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Calculate Your Dropshipping Profit Potential
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              Estimate how much you can earn every month selling products online across Bangladesh.
            </p>
          </div>

          <div className="bg-[#171226] border border-[#302741] p-6 sm:p-8 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-white mb-2">
                  <span>Daily Customer Orders:</span>
                  <span className="font-mono text-[#22D3EE] font-bold text-sm">{dailyOrders} orders / day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={dailyOrders}
                  onChange={(e) => setDailyOrders(parseInt(e.target.value, 10))}
                  className="w-full accent-[#7C3AED] bg-[#100D1B] h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#C9C4D6]/60 mt-1 font-mono">
                  <span>1 Order</span>
                  <span>25 Orders</span>
                  <span>50 Orders</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-white mb-2">
                  <span>Average Profit Margin Per Item:</span>
                  <span className="font-mono text-[#34D399] font-bold text-sm">৳ {profitPerOrder} BDT</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={profitPerOrder}
                  onChange={(e) => setProfitPerOrder(parseInt(e.target.value, 10))}
                  className="w-full accent-[#34D399] bg-[#100D1B] h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#C9C4D6]/60 mt-1 font-mono">
                  <span>৳ 150</span>
                  <span>৳ 600</span>
                  <span>৳ 1,200</span>
                </div>
              </div>

              <div className="text-[11px] text-[#C9C4D6] space-y-1">
                <div>✓ Zero inventory purchase risk</div>
                <div>✓ Courier fees collected directly from customer at doorstep</div>
                <div>✓ Daily withdrawals via bKash, Nagad, or Bank</div>
              </div>
            </div>

            {/* Calculated Output Box */}
            <div className="bg-[#100D1B] border border-[#7C3AED]/40 p-6 rounded-xl space-y-4 text-center">
              <span className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">
                Estimated Net Earnings
              </span>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                  {formatBDT(monthlyProfit)}
                </div>
                <span className="text-xs text-[#34D399] font-semibold">Per Month ({monthlyOrders} parcels)</span>
              </div>

              <div className="pt-2 border-t border-[#302741] flex justify-between text-xs font-mono text-[#C9C4D6]">
                <span>Annualized Revenue:</span>
                <strong className="text-[#22D3EE]">{formatBDT(yearlyProfit)}</strong>
              </div>

              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                <span>Join Up & Start Earning</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Live Video Tutorials & Knowledge Base (Connected to Super Admin CMS 3.3) */}
      <section id="tutorials" className="py-16 bg-[#100D1B] border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">
                Learning Center
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Video Tutorials & Operational Guides
              </h2>
              <p className="text-xs text-[#C9C4D6] mt-0.5">
                Curated walkthroughs maintained directly by the DropNest Super Admin leadership.
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#171226] rounded-lg border border-[#302741] text-xs">
              {['ALL', 'Reseller Guides', 'Supplier Manuals', 'Order Fulfillment', 'Financial Settlement'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTutCategory(cat)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    tutCategory === cat ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Guides' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTutorials.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-xs text-[#C9C4D6] bg-[#171226] border border-[#302741] rounded-xl">
                No tutorial guides currently in this category.
              </div>
            ) : (
              filteredTutorials.map((tut) => (
                <div
                  key={tut.id}
                  onClick={() => setActiveVideoModal(tut)}
                  className="bg-[#171226] border border-[#302741] hover:border-[#7C3AED] rounded-2xl overflow-hidden cursor-pointer group transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-[#080611] flex items-center justify-center overflow-hidden">
                    <img
                      src={tut.thumbnailUrl || '/Image/Dashboard Background.jpg'}
                      alt={tut.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-60"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#7C3AED] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] font-mono">
                      {tut.category}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#22D3EE] transition-colors line-clamp-1">
                      {tut.title}
                    </h4>
                    <p className="text-xs text-[#C9C4D6] line-clamp-2 leading-relaxed">
                      {tut.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 9. Blog Section (Required Navigation Item: Blog) */}
      <section id="blog" className="py-16 border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">
              Dropshipping Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              DropNest Official Blog & Merchant Guides
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              Actionable insights on e-commerce marketing, COD courier optimization, and high-margin product selection in Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post) => (
              <div
                key={post.id}
                className="bg-[#171226] border border-[#302741] hover:border-[#FBBF24]/50 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#C9C4D6]">
                    <span className="px-2 py-0.5 rounded bg-[#FBBF24]/15 text-[#FBBF24] font-bold text-[10px] uppercase font-mono">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-[#22D3EE] transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#C9C4D6] leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#302741] flex items-center justify-between">
                  <span className="text-[11px] text-[#C9C4D6]/70">{post.date}</span>
                  <button
                    onClick={() => setSelectedBlog(post)}
                    className="text-xs font-bold text-[#22D3EE] hover:underline flex items-center gap-1"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Contact Us Section (Required: Phone: +88 01893-665896, Email: Dropnestbd@gamil.com, Website: Dropnest.com.bd) */}
      <section id="contact" className="py-16 bg-[#100D1B] border-b border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Contact DropNest Bangladesh
            </h2>
            <p className="text-xs sm:text-sm text-[#C9C4D6]">
              Our dedicated merchant onboarding and supplier integration team is here to assist you 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Details Card */}
            <div className="lg:col-span-5 bg-[#171226] border border-[#302741] p-6 sm:p-8 rounded-2xl space-y-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-[#A855F7]">
                Official Contact Information
              </h3>

              <div className="space-y-4 text-xs">
                {/* Official Phone */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#100D1B] border border-[#302741]">
                  <div className="p-2 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#C9C4D6] uppercase tracking-wider font-semibold">Phone Helpline</div>
                    <a href={`tel:${displayPhone.replace(/\s+/g, '')}`} className="font-mono text-sm font-bold text-white hover:text-[#22D3EE]">
                      {displayPhone}
                    </a>
                    <div className="text-[10px] text-[#34D399]">Available 24/7 for Resellers & Suppliers</div>
                  </div>
                </div>

                {/* Official Email */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#100D1B] border border-[#302741]">
                  <div className="p-2 rounded-lg bg-[#EC4899]/20 text-[#EC4899]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#C9C4D6] uppercase tracking-wider font-semibold">Official Email</div>
                    <a href={`mailto:${displayEmail}`} className="font-mono text-sm font-bold text-white hover:text-[#EC4899]">
                      {displayEmail}
                    </a>
                    <div className="text-[10px] text-[#C9C4D6]">Response within 4 operational hours</div>
                  </div>
                </div>

                {/* Official Website */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#100D1B] border border-[#302741]">
                  <div className="p-2 rounded-lg bg-[#FBBF24]/20 text-[#FBBF24]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#C9C4D6] uppercase tracking-wider font-semibold">Official Website</div>
                    <span className="font-mono text-sm font-bold text-white">
                      {displayWebsite}
                    </span>
                    <div className="text-[10px] text-[#C9C4D6]">Encrypted HTTPS sovereign e-commerce portal</div>
                  </div>
                </div>

                {/* Corporate Address */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#100D1B] border border-[#302741]">
                  <div className="p-2 rounded-lg bg-[#7C3AED]/20 text-[#A855F7]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#C9C4D6] uppercase tracking-wider font-semibold">Corporate HQ</div>
                    <div className="text-xs font-semibold text-white">
                      {company?.companyAddress || 'Level 14, DropNest Commercial Tower, Road 11, Gulshan-2, Dhaka 1212, Bangladesh'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Functional Contact Form */}
            <div className="lg:col-span-7 bg-[#171226] border border-[#302741] p-6 sm:p-8 rounded-2xl space-y-5">
              <div className="border-b border-[#302741] pb-3">
                <h3 className="text-base font-bold text-white">Send an Inquiry or Feedback</h3>
                <p className="text-xs text-[#C9C4D6] mt-0.5">
                  Submissions are dispatched straight to the DropNest Super Admin operations center.
                </p>
              </div>

              {contactFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    contactFeedback.type === 'success'
                      ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
                      : 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                  }`}
                >
                  {contactFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{contactFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Full Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Bangladesh Mobile <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Subject
                    </label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="Reseller Inquiry">Reseller Onboarding & Payouts</option>
                      <option value="Supplier Factory Partnership">Wholesale Supplier Listing</option>
                      <option value="Steadfast Courier Delivery">Courier Dispatch & COD Query</option>
                      <option value="General Corporate Support">General Corporate Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Your Message <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    placeholder="Describe how we can assist you..."
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-16 border-b border-[#302741]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
              Answers & Help
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-[#C9C4D6]">
              Clear information about dropshipping and supplier operations in Bangladesh.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Do I need any capital or money to start reselling on DropNest?',
                a: 'No upfront capital is required. You can register as a reseller completely free. You browse factory products, download descriptions, set your own selling price, and market them on your channels. Only when a customer places an order do you submit it to DropNest.',
              },
              {
                q: 'How does Cash On Delivery (COD) collection work?',
                a: 'Our integrated courier partners (Steadfast Logistics BD, RedX Express) pick up the packaged goods from the manufacturer factory, transport them to the customer doorstep anywhere across Bangladesh 64 districts, and collect the cash at delivery.',
              },
              {
                q: 'How fast can I withdraw my profits to bKash or Nagad?',
                a: 'Once the parcel is marked Delivered by the courier partner, your profit margin is credited to your available balance. You can request a withdrawal directly to your bKash, Nagad, or Bank account, which is processed within 24 hours.',
              },
              {
                q: 'Who packages the parcel and whose brand name appears on it?',
                a: 'The factory supplier packages the product according to DropNest standards with your registered Store Name printed as the sender on the courier delivery slip, protecting your customer relationship.',
              },
              {
                q: 'How are returns and damaged deliveries handled?',
                a: 'Our automated 17-status Order Tracker logs all transit milestones. If a customer refuses a delivery, the package is returned directly to the merchant hub, and our Super Admin fraud review protects sellers against malicious orders.',
              },
              {
                q: 'How do factory suppliers join DropNest?',
                a: 'Manufacturers and wholesale suppliers apply via the Supplier Portal. Once verified by our Admin team with trade credentials, suppliers list factory-priced catalogs accessible to our nationwide reseller network.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-white hover:text-[#22D3EE]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A855F7] transition-transform ${
                      openFaqIndex === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 text-xs text-[#C9C4D6] leading-relaxed border-t border-[#302741]/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. Corporate Footer (Directly Connected to Super Admin Company Info 3.1) */}
      <footer className="bg-[#080611] text-[#C9C4D6] text-xs pt-12 pb-8 border-t border-[#302741]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Bio */}
            <div className="space-y-3">
              <DropNestLogo size="md" />
              <p className="text-xs text-[#C9C4D6]/80 leading-relaxed">
                {cms?.footerAbout ||
                  'DropNest is Bangladesh’s leading dropshipping platform connecting digital resellers directly with verified factory suppliers nationwide.'}
              </p>
              <div className="text-[11px] text-[#34D399] font-semibold">
                Covering all 64 districts in Bangladesh
              </div>
            </div>

            {/* Col 2: Role Access Portals & Navigation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Quick Navigation & Panels
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveModal('ABOUT')}
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateToLogin('RESELLER')}
                    className="hover:text-white transition-colors"
                  >
                    Dropshipper Login
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateToLogin('SUPPLIER')}
                    className="hover:text-white transition-colors"
                  >
                    Supplier Panel
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('SUPPORT')}
                    className="hover:text-white transition-colors"
                  >
                    Support Centre
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateToLogin('SUPER_ADMIN')}
                    className="text-[#EC4899] hover:underline font-bold"
                  >
                    Super Admin Master Panel
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Courier Partners & Gateways */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Logistics & Payment Partners
              </h4>
              <ul className="space-y-1.5 text-xs text-[#C9C4D6]">
                <li>Steadfast Courier BD (API Integrated)</li>
                <li>RedX Express Logistics</li>
                <li>Pathao Courier Bangladesh</li>
                <li>Paperfly Express</li>
                <li className="pt-2 text-white font-semibold">Payout Gateways:</li>
                <li className="text-[#34D399] font-mono">bKash · Nagad · City Bank</li>
              </ul>
            </div>

            {/* Col 4: Registered Company Information (Phone +88 01893-665896, Dropnestbd@gamil.com, Dropnest.com.bd) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Corporate HQ & Contact
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-white">
                  {company?.companyName || 'DropNest Bangladesh Technologies Ltd.'}
                </div>
                <div className="text-[11px] text-[#C9C4D6]">
                  {company?.companyAddress || 'Level 14, DropNest Commercial Tower, Road 11, Gulshan-2, Dhaka 1212, Bangladesh'}
                </div>
                <div>
                  Phone: <a href={`tel:${displayPhone.replace(/\s+/g, '')}`} className="font-mono text-[#22D3EE] hover:underline">{displayPhone}</a>
                </div>
                <div>
                  Email: <a href={`mailto:${displayEmail}`} className="text-[#C9C4D6] hover:underline">{displayEmail}</a>
                </div>
                <div>
                  Website: <span className="font-mono text-[#FBBF24]">{displayWebsite}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright bar with Legal Modals */}
          <div className="pt-8 border-t border-[#302741] flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <div>
              {cms?.footerCopyright || '© 2026 DropNest Technologies Ltd. All Rights Reserved.'}
            </div>
            <div className="flex items-center gap-4 text-[#C9C4D6]/70">
              <button onClick={() => setActiveModal('TERMS')} className="hover:text-white">
                Terms & Conditions
              </button>
              <span>·</span>
              <button onClick={() => setActiveModal('PRIVACY')} className="hover:text-white">
                Privacy Policy
              </button>
              <span>·</span>
              <button onClick={() => setActiveModal('REFUND')} className="hover:text-white">
                Refund Policy
              </button>
              <span>·</span>
              <button onClick={() => setActiveModal('SHIPPING')} className="hover:text-white">
                Shipping Policy
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* A2. Join Up Reseller Registration Modal */}
      {showRegisterModal && (
        <RegisterModal
          role="RESELLER"
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {/* Video Tutorial Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A855F7]">
                  {activeVideoModal.category}
                </span>
                <h3 className="text-sm font-bold text-white">{activeVideoModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Video Simulated Player */}
            <div className="relative aspect-video bg-[#080611] rounded-xl overflow-hidden flex items-center justify-center border border-[#302741]">
              <img
                src={activeVideoModal.thumbnailUrl || '/Image/Dashboard Background.jpg'}
                alt={activeVideoModal.title}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <div className="text-xs font-bold text-white mt-2">
                  DropNest Knowledge Base Walkthrough
                </div>
                <div className="text-[11px] text-[#C9C4D6] font-mono">
                  Target Resource: {activeVideoModal.videoUrl}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#C9C4D6] leading-relaxed">
              {activeVideoModal.description}
            </p>

            <div className="flex justify-end pt-2 border-t border-[#302741]">
              <button
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-lg"
              >
                Close Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Article Reader Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 my-8 relative">
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 text-[#C9C4D6] hover:text-white p-1"
            >
              ✕
            </button>

            <div className="space-y-2 border-b border-[#302741] pb-4">
              <span className="px-2.5 py-0.5 rounded bg-[#FBBF24]/20 text-[#FBBF24] font-bold text-[10px] uppercase font-mono">
                {selectedBlog.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {selectedBlog.title}
              </h2>
              <div className="flex items-center gap-4 text-xs text-[#C9C4D6]">
                <span>By {selectedBlog.author}</span>
                <span>•</span>
                <span>{selectedBlog.date}</span>
                <span>•</span>
                <span>{selectedBlog.readTime}</span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[#C9C4D6] leading-relaxed space-y-3 whitespace-pre-line">
              {selectedBlog.content}
            </div>

            <div className="pt-4 border-t border-[#302741] flex justify-between items-center">
              <span className="text-[11px] text-[#34D399] font-semibold">DropNest Research Desk</span>
              <button
                onClick={() => setSelectedBlog(null)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal Views (About Us, Information, Community, Support, Policies) */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 my-8 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#C9C4D6] hover:text-white p-1"
            >
              ✕
            </button>

            {/* About Us Modal */}
            {activeModal === 'ABOUT' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <span className="text-xs font-bold text-[#A855F7] uppercase tracking-wider font-mono">
                    Corporate Profile
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    About DropNest Technologies
                  </h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-3 leading-relaxed">
                  <p>
                    DropNest is Bangladesh’s pioneer dropshipping and digital reseller ecosystem, established to resolve the key bottlenecks of domestic e-commerce: fragmented factory sourcing, inventory risk, delayed courier deliveries, and unreliable profit settlements.
                  </p>
                  <p>
                    By connecting verified local manufacturers directly with thousands of ambitious digital entrepreneurs, DropNest removes the barrier of entry into online commerce. Resellers can establish high-margin stores with 0 Tk upfront stock, while manufacturing factories scale wholesale distribution across all 64 districts.
                  </p>
                  <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl space-y-1">
                    <div className="text-white font-bold">Our Mission:</div>
                    <div>To empower 100,000 independent Bangladeshi digital entrepreneurs by 2028 with institutional-grade dropshipping infrastructure.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Information Modal */}
            {activeModal === 'INFORMATION' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <span className="text-xs font-bold text-[#34D399] uppercase tracking-wider font-mono">
                    Operational Standards
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Platform Rules & Compliance
                  </h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-3 leading-relaxed">
                  <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl">
                    <strong className="text-white block mb-1">1. Zero Inventory Risk Policy</strong>
                    <span>Resellers never pay upfront for unsold inventory. You only book orders when a customer confirms intent to purchase.</span>
                  </div>
                  <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl">
                    <strong className="text-white block mb-1">2. Same-Day Dispatch SLA</strong>
                    <span>Supplier factories must pack and hand over confirmed parcels to Steadfast/RedX pickup riders within 24 operational hours.</span>
                  </div>
                  <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl">
                    <strong className="text-white block mb-1">3. Automated BDT Payout Cycles</strong>
                    <span>Available wallet balances can be withdrawn daily directly to verified bKash, Nagad, or Bangladeshi commercial bank accounts.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Community Modal */}
            {activeModal === 'COMMUNITY' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <span className="text-xs font-bold text-[#EC4899] uppercase tracking-wider font-mono">
                    Network & Collaboration
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    DropNest Reseller & Supplier Community
                  </h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-3 leading-relaxed">
                  <p>
                    Join over 12,000 active Bangladeshi sellers in our private channels to exchange marketing strategies, trending product alerts, and courier optimization tips.
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Official Telegram Announcement Channel</div>
                        <div className="text-[11px] text-[#C9C4D6]">Real-time new product releases & stock alerts</div>
                      </div>
                      <span className="text-xs font-mono text-[#22D3EE] font-bold">@DropNestBD</span>
                    </div>

                    <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Facebook VIP Reseller Group</div>
                        <div className="text-[11px] text-[#C9C4D6]">Discussion, success stories, and marketing advice</div>
                      </div>
                      <span className="text-xs font-mono text-[#A855F7] font-bold">facebook.com/groups/dropnestbd</span>
                    </div>

                    <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">WhatsApp Supplier Factory Desk</div>
                        <div className="text-[11px] text-[#C9C4D6]">Wholesale manufacturing coordination</div>
                      </div>
                      <span className="text-xs font-mono text-[#34D399] font-bold">{displayPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support Centre Modal */}
            {activeModal === 'SUPPORT' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <span className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider font-mono">
                    24/7 Assistance
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    DropNest Support Centre
                  </h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-3 leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl">
                      <div className="text-[#22D3EE] font-bold text-sm">Helpline Hotline</div>
                      <div className="font-mono text-base font-extrabold text-white mt-1">{displayPhone}</div>
                      <div className="text-[10px] text-[#C9C4D6]">24 hours a day, 7 days a week</div>
                    </div>
                    <div className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl">
                      <div className="text-[#EC4899] font-bold text-sm">Email Support</div>
                      <div className="font-mono text-sm font-bold text-white mt-1">{displayEmail}</div>
                      <div className="text-[10px] text-[#C9C4D6]">Response within 4 hours</div>
                    </div>
                  </div>
                  <p>
                    For registered resellers and suppliers, you can also submit direct high-priority tickets through your authenticated dashboard E-mail Box.
                  </p>
                </div>
              </div>
            )}

            {/* Terms & Conditions Modal */}
            {activeModal === 'TERMS' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <h2 className="text-xl font-bold text-white">Terms & Conditions</h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-2 leading-relaxed max-h-96 overflow-y-auto pr-2">
                  <p>1. <strong>Account Eligibility:</strong> Users must be at least 18 years of age and hold a valid Bangladesh National ID (NID) and 11-digit mobile phone number.</p>
                  <p>2. <strong>Zero Fraud Tolerance:</strong> Resellers are strictly prohibited from generating fictitious orders or misrepresenting product specifications. Any systematic fraudulent orders will lead to immediate account suspension and withholding of unsettled funds.</p>
                  <p>3. <strong>Pricing and Margins:</strong> Resellers are free to determine retail markup above the factory wholesale price, subject to national fair trade regulations.</p>
                  <p>4. <strong>Supplier Integrity:</strong> Factory suppliers must deliver authentic products identical to uploaded imagery and packaging standards.</p>
                </div>
              </div>
            )}

            {/* Privacy Policy Modal */}
            {activeModal === 'PRIVACY' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-2 leading-relaxed max-h-96 overflow-y-auto pr-2">
                  <p>DropNest values the privacy of Bangladeshi merchants and end consumers. We collect only necessary details to fulfill logistics and financial settlements.</p>
                  <p>1. <strong>Customer Data Protection:</strong> End-customer phone numbers and addresses are transmitted securely to courier partners solely for the purpose of doorstep COD delivery.</p>
                  <p>2. <strong>Financial Information:</strong> bKash, Nagad, and bank details provided by resellers are encrypted and utilized solely for payout transfers.</p>
                  <p>3. <strong>Data Sovereignity:</strong> DropNest never sells or rents user data to third-party marketing brokers.</p>
                </div>
              </div>
            )}

            {/* Refund Policy Modal */}
            {activeModal === 'REFUND' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <h2 className="text-xl font-bold text-white">Refund & Return Policy</h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-2 leading-relaxed max-h-96 overflow-y-auto pr-2">
                  <p>1. <strong>Defective or Damaged Products:</strong> If an end-customer receives a damaged or defective item, a replacement or refund claim must be submitted through the reseller within 48 hours of delivery accompanied by an unboxing photo or video.</p>
                  <p>2. <strong>Doorstep Refusals:</strong> Customers have the right to inspect parcels at delivery in the presence of the rider. If refused, the parcel enters the return workflow back to the hub.</p>
                  <p>3. <strong>Supplier Liability:</strong> Factory suppliers bear return costs for products proven to have manufacturing flaws.</p>
                </div>
              </div>
            )}

            {/* Shipping Policy Modal */}
            {activeModal === 'SHIPPING' && (
              <div className="space-y-4">
                <div className="border-b border-[#302741] pb-3">
                  <h2 className="text-xl font-bold text-white">Shipping & Delivery Policy</h2>
                </div>
                <div className="text-xs text-[#C9C4D6] space-y-2 leading-relaxed max-h-96 overflow-y-auto pr-2">
                  <p>1. <strong>64 Districts Nationwide Coverage:</strong> DropNest covers all 64 districts and 490+ upazilas in Bangladesh through Steadfast Logistics and RedX Express.</p>
                  <p>2. <strong>Delivery Rates:</strong> Inside Dhaka delivery charge is ৳60 BDT. Outside Dhaka delivery charge is ৳120 BDT.</p>
                  <p>3. <strong>Timelines:</strong> Inside Dhaka deliveries typically complete within 24 hours. Outside Dhaka orders deliver within 48 to 72 hours.</p>
                  <p>4. <strong>Live Order Tracking:</strong> Every parcel generates a 17-status tracking record allowing real-time SMS updates to the buyer.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#302741]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
