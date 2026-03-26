"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bookmark,
  Heart,
  MessageCircle,
  ChevronUp,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  Check,
  Sparkles,
  BookOpen,
  TrendingUp,
  Eye
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./blog-post.module.css";

// Blog posts data - same as blog listing page
const blogPosts = [
  {
    slug: "ai-healthcare-diagnostics",
    image: "/images/blog-medtech.png",
    category: "Technology",
    date: "Mar 15, 2026",
    author: "Dr. Sarah Chen",
    authorRole: "Chief of Medical Innovation",
    authorAvatar: "/images/about-team.png",
    readTime: "8 min read",
    title: "The Future of AI in Healthcare Diagnostics",
    excerpt: "Discover how artificial intelligence is revolutionizing the way doctors diagnose and treat complex medical conditions.",
    color: "#0E898F",
    bgColor: "#E6F4F4",
    views: 1247,
    likes: 89,
    content: `
      <p>Artificial intelligence is transforming healthcare in ways we never imagined possible. From detecting early-stage cancers to predicting patient outcomes, AI-powered diagnostic tools are becoming indispensable allies for medical professionals worldwide.</p>
      
      <h2>The Revolution in Medical Imaging</h2>
      <p>One of the most significant breakthroughs has been in medical imaging. AI algorithms can now analyze X-rays, MRIs, and CT scans with remarkable accuracy, often detecting anomalies that human eyes might miss. Studies have shown that AI can reduce diagnostic errors by up to 30% in certain specialties.</p>
      
      <blockquote>"AI doesn't replace doctors—it amplifies their capabilities, allowing them to focus on what matters most: patient care."</blockquote>
      
      <h2>Early Disease Detection</h2>
      <p>Machine learning models are now capable of identifying patterns in patient data that signal the early stages of diseases like diabetes, heart disease, and even Alzheimer's. This early detection capability is saving lives and reducing healthcare costs significantly.</p>
      
      <h3>Key Benefits of AI Diagnostics:</h3>
      <ul>
        <li>Faster diagnosis and treatment initiation</li>
        <li>Reduced human error in complex cases</li>
        <li>24/7 availability for preliminary screenings</li>
        <li>Personalized treatment recommendations</li>
        <li>Predictive analytics for preventive care</li>
      </ul>
      
      <h2>The Human-AI Partnership</h2>
      <p>It's important to understand that AI in healthcare is not about replacing human doctors. Instead, it's about creating a powerful partnership where AI handles data analysis and pattern recognition, while doctors bring their empathy, experience, and clinical judgment to patient care.</p>
      
      <h2>Looking Ahead</h2>
      <p>As we move forward, we can expect AI to become even more integrated into healthcare systems. From virtual health assistants to predictive analytics for hospital management, the possibilities are endless. The future of healthcare is a blend of human compassion and artificial intelligence working together for better patient outcomes.</p>
    `
  },
  {
    slug: "regular-health-checkups",
    image: "/images/blog-consultation.png",
    category: "Patient Care",
    date: "Mar 12, 2026",
    author: "Dr. James Wilson",
    authorRole: "Head of Preventive Medicine",
    authorAvatar: "/images/about-team.png",
    readTime: "6 min read",
    title: "Why Regular Health Checkups Save Lives",
    excerpt: "Learn about the importance of preventive healthcare and routine checkups for early detection.",
    color: "#10B981",
    bgColor: "#D1FAE5",
    views: 982,
    likes: 67,
    content: `
      <p>Preventive healthcare is the cornerstone of a long, healthy life. Regular health checkups are not just about finding problems—they're about preventing them from occurring in the first place. In this comprehensive guide, we'll explore why routine medical examinations should be a priority for everyone.</p>
      
      <h2>The Power of Prevention</h2>
      <p>Many serious health conditions, including heart disease, diabetes, and certain cancers, develop silently over years. By the time symptoms appear, the condition may have progressed significantly. Regular checkups catch these issues early, when they're most treatable.</p>
      
      <blockquote>"An ounce of prevention is worth a pound of cure. Regular checkups are your best defense against serious illness."</blockquote>
      
      <h2>What to Expect During a Checkup</h2>
      <p>A comprehensive health checkup typically includes blood pressure monitoring, cholesterol screening, blood sugar tests, and physical examinations. Depending on your age and risk factors, your doctor may recommend additional screenings.</p>
      
      <h3>Recommended Checkup Schedule:</h3>
      <ul>
        <li><strong>Ages 18-39:</strong> Every 2-3 years</li>
        <li><strong>Ages 40-64:</strong> Annually</li>
        <li><strong>Ages 65+:</strong> Every 6-12 months</li>
        <li><strong>High-risk individuals:</strong> As recommended by your doctor</li>
      </ul>
      
      <h2>The Cost of Neglect</h2>
      <p>Skipping regular checkups might seem like a way to save time and money, but it often leads to higher healthcare costs in the long run. Treating advanced diseases is significantly more expensive than preventing them or catching them early.</p>
      
      <h2>Building a Relationship with Your Doctor</h2>
      <p>Regular visits help you build a meaningful relationship with your healthcare provider. They get to know your health history, lifestyle, and concerns, enabling them to provide more personalized care.</p>
    `
  },
  {
    slug: "heart-health-habits",
    image: "/images/blog-wellness.png",
    category: "Wellness",
    date: "Mar 10, 2026",
    author: "Dr. Emily Park",
    authorRole: "Cardiologist & Wellness Expert",
    authorAvatar: "/images/about-team.png",
    readTime: "5 min read",
    title: "5 Simple Habits for Better Heart Health",
    excerpt: "Small lifestyle changes can make a big difference. Here are five evidence-based habits for a healthier heart.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    views: 2156,
    likes: 156,
    content: `
      <p>Heart disease remains the leading cause of death worldwide, but the good news is that many risk factors are within our control. Small, consistent lifestyle changes can dramatically improve your heart health and overall quality of life.</p>
      
      <h2>1. Move More, Sit Less</h2>
      <p>Regular physical activity strengthens your heart muscle, improves circulation, and helps maintain a healthy weight. Aim for at least 150 minutes of moderate exercise per week. This could be brisk walking, swimming, cycling, or any activity that gets your heart pumping.</p>
      
      <blockquote>"Your heart is a muscle, and like any muscle, it gets stronger with regular exercise."</blockquote>
      
      <h2>2. Eat Heart-Healthy Foods</h2>
      <p>A diet rich in fruits, vegetables, whole grains, and lean proteins supports cardiovascular health. Focus on foods high in omega-3 fatty acids, fiber, and antioxidants. Limit saturated fats, trans fats, and added sugars.</p>
      
      <h2>3. Manage Stress Effectively</h2>
      <p>Chronic stress takes a toll on your heart. Practice stress-reduction techniques like meditation, deep breathing, yoga, or spending time in nature. Even 10 minutes of daily mindfulness can make a significant difference.</p>
      
      <h2>4. Prioritize Quality Sleep</h2>
      <p>Poor sleep is linked to high blood pressure, obesity, and diabetes—all risk factors for heart disease. Aim for 7-9 hours of quality sleep each night. Establish a consistent sleep schedule and create a relaxing bedtime routine.</p>
      
      <h2>5. Stay Connected</h2>
      <p>Strong social connections are surprisingly important for heart health. People with robust social networks tend to have lower blood pressure and reduced risk of heart disease. Make time for friends and family.</p>
      
      <h3>Quick Heart-Healthy Tips:</h3>
      <ul>
        <li>Take the stairs instead of the elevator</li>
        <li>Replace sugary drinks with water</li>
        <li>Practice gratitude daily</li>
        <li>Limit alcohol consumption</li>
        <li>Don't smoke or vape</li>
      </ul>
    `
  },
  {
    slug: "gene-therapy-breakthroughs",
    image: "/images/about-team.png",
    category: "Research",
    date: "Mar 8, 2026",
    author: "Dr. Michael Rivera",
    authorRole: "Director of Genetic Research",
    authorAvatar: "/images/about-team.png",
    readTime: "10 min read",
    title: "Breakthroughs in Gene Therapy for Rare Diseases",
    excerpt: "New advances in gene therapy are opening doors for treating previously untreatable genetic conditions.",
    color: "#F97316",
    bgColor: "#FFF7ED",
    views: 743,
    likes: 45,
    content: `
      <p>Gene therapy represents one of the most promising frontiers in modern medicine. By directly addressing the genetic roots of disease, this revolutionary approach is offering hope to patients with conditions once considered untreatable.</p>
      
      <h2>Understanding Gene Therapy</h2>
      <p>Gene therapy works by introducing, removing, or changing genetic material within a person's cells to treat or cure disease. This can involve replacing a mutated gene with a healthy copy, inactivating a malfunctioning gene, or introducing a new gene to help fight disease.</p>
      
      <blockquote>"We're witnessing a paradigm shift in how we approach genetic diseases. For the first time, we can address the root cause rather than just managing symptoms."</blockquote>
      
      <h2>Recent Breakthroughs</h2>
      <p>The past few years have seen remarkable progress. FDA-approved therapies now exist for conditions like spinal muscular atrophy, certain forms of inherited blindness, and specific types of leukemia. Clinical trials are underway for hundreds of other conditions.</p>
      
      <h3>Conditions Being Targeted:</h3>
      <ul>
        <li>Sickle cell disease</li>
        <li>Hemophilia</li>
        <li>Muscular dystrophy</li>
        <li>Cystic fibrosis</li>
        <li>Certain inherited forms of blindness</li>
        <li>Some types of cancer</li>
      </ul>
      
      <h2>Challenges and Solutions</h2>
      <p>Despite the promise, gene therapy faces challenges including high costs, delivery method limitations, and ensuring long-term safety. Researchers are actively working on solutions, from developing more efficient viral vectors to creating non-viral delivery systems.</p>
      
      <h2>The Future is Bright</h2>
      <p>As technology advances and costs decrease, gene therapy could become a standard treatment option for many genetic conditions. The goal is to make these life-changing treatments accessible to all who need them.</p>
    `
  },
  {
    slug: "telemedicine-new-normal",
    image: "/images/blog-medtech.png",
    category: "Technology",
    date: "Mar 5, 2026",
    author: "Dr. Sarah Chen",
    authorRole: "Chief of Medical Innovation",
    authorAvatar: "/images/about-team.png",
    readTime: "7 min read",
    title: "Telemedicine: The New Normal in Healthcare",
    excerpt: "How virtual consultations are making healthcare more accessible and convenient for millions.",
    color: "#0E898F",
    bgColor: "#E6F4F4",
    views: 1834,
    likes: 112,
    content: `
      <p>The healthcare landscape has been forever changed by the widespread adoption of telemedicine. What began as a necessity during the pandemic has evolved into a preferred option for millions of patients worldwide, offering unprecedented convenience and accessibility.</p>
      
      <h2>The Telemedicine Revolution</h2>
      <p>Virtual healthcare consultations have broken down geographical barriers, making it possible for patients in remote areas to access specialist care. No longer do you need to travel hours for a 15-minute consultation with a specialist.</p>
      
      <blockquote>"Telemedicine isn't just about convenience—it's about democratizing access to quality healthcare."</blockquote>
      
      <h2>Benefits for Patients</h2>
      <p>Patients enjoy numerous advantages: no travel time, reduced waiting room exposure to illness, easier scheduling, and the comfort of consulting from home. For those with mobility issues or chronic conditions, these benefits are life-changing.</p>
      
      <h3>What Can Be Treated Virtually:</h3>
      <ul>
        <li>Routine follow-ups and medication management</li>
        <li>Mental health counseling</li>
        <li>Minor illnesses and infections</li>
        <li>Chronic disease monitoring</li>
        <li>Prescription renewals</li>
        <li>Second opinions</li>
      </ul>
      
      <h2>Technology Making It Possible</h2>
      <p>High-speed internet, smartphones, and secure video platforms have made telemedicine seamless. Advanced features like digital stethoscopes, otoscopes, and wearable devices allow doctors to gather vital information remotely.</p>
      
      <h2>The Hybrid Future</h2>
      <p>The future of healthcare is hybrid—a blend of in-person and virtual care. While some conditions will always require physical examination, many aspects of healthcare can be effectively managed remotely, creating a more efficient and patient-centered system.</p>
    `
  },
  {
    slug: "mental-health-workplace",
    image: "/images/blog-consultation.png",
    category: "Patient Care",
    date: "Mar 3, 2026",
    author: "Dr. James Wilson",
    authorRole: "Head of Preventive Medicine",
    authorAvatar: "/images/about-team.png",
    readTime: "8 min read",
    title: "Understanding Mental Health in the Workplace",
    excerpt: "A comprehensive guide to recognizing and addressing mental health challenges in professional settings.",
    color: "#10B981",
    bgColor: "#D1FAE5",
    views: 1567,
    likes: 98,
    content: `
      <p>Mental health in the workplace has emerged as a critical issue affecting millions of professionals worldwide. As we spend a significant portion of our lives at work, creating mentally healthy work environments is essential for both individual wellbeing and organizational success.</p>
      
      <h2>The Scope of the Challenge</h2>
      <p>Work-related stress, burnout, anxiety, and depression are increasingly common. The World Health Organization estimates that depression and anxiety cost the global economy $1 trillion annually in lost productivity. Yet, mental health remains stigmatized in many professional settings.</p>
      
      <blockquote>"A healthy workplace is one where employees feel safe to discuss mental health without fear of judgment or career repercussions."</blockquote>
      
      <h2>Recognizing the Signs</h2>
      <p>Early recognition of mental health struggles is crucial. Common signs include persistent fatigue, difficulty concentrating, irritability, withdrawal from colleagues, decreased productivity, and physical symptoms like headaches or insomnia.</p>
      
      <h3>Strategies for Employees:</h3>
      <ul>
        <li>Set clear boundaries between work and personal life</li>
        <li>Take regular breaks throughout the day</li>
        <li>Practice stress management techniques</li>
        <li>Seek support from trusted colleagues</li>
        <li>Utilize employee assistance programs</li>
        <li>Don't hesitate to seek professional help</li>
      </ul>
      
      <h2>Employer's Role</h2>
      <p>Forward-thinking organizations are implementing mental health initiatives, including flexible work arrangements, mental health days, employee assistance programs, and training for managers to recognize and support struggling team members.</p>
      
      <h2>Creating Cultural Change</h2>
      <p>True change requires shifting workplace culture to normalize mental health conversations. When leaders openly discuss mental health, it gives permission for everyone else to do the same, creating a more supportive and productive work environment.</p>
    `
  }
];

// Related posts component
function RelatedPosts({ currentSlug, category }: { currentSlug: string; category: string }) {
  const related = blogPosts
    .filter(p => p.slug !== currentSlug && p.category === category)
    .slice(0, 2);
  
  if (related.length === 0) {
    // If no same category, get random posts
    const others = blogPosts.filter(p => p.slug !== currentSlug).slice(0, 2);
    return <RelatedPostsList posts={others} />;
  }
  
  return <RelatedPostsList posts={related} />;
}

function RelatedPostsList({ posts }: { posts: typeof blogPosts }) {
  return (
    <div className={styles.relatedGrid}>
      {posts.map((post, i) => (
        <motion.article
          key={post.slug}
          className={styles.relatedCard}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Link href={`/blog/${post.slug}`} className={styles.relatedLink}>
            <div className={styles.relatedImageWrapper}>
              <Image
                src={post.image}
                alt={post.title}
                fill
                className={styles.relatedImage}
              />
              <span className={styles.relatedCategory} style={{ color: post.color, background: post.bgColor }}>
                {post.category}
              </span>
            </div>
            <div className={styles.relatedContent}>
              <h4 className={styles.relatedTitle}>{post.title}</h4>
              <div className={styles.relatedMeta}>
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
            </div>
          </Link>
        </motion.article>
      ))}
    </div>
  );
}

// Table of Contents component
function TableOfContents({ content }: { content: string }) {
  const [activeSection, setActiveSection] = useState("");

  const headings = useMemo(() => {
    const matches = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/g) || [];
    return matches.map((h) => {
      const text = h.replace(/<[^>]+>/g, "");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const level = h.startsWith("<h3") ? 3 : 2;
      return { text, id, level };
    });
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className={styles.toc}>
      <h3 className={styles.tocTitle}>
        <BookOpen size={18} />
        Table of Contents
      </h3>
      <ul className={styles.tocList}>
        {headings.map(({ text, id, level }) => (
          <li key={id} className={level === 3 ? styles.tocItemSub : styles.tocItem}>
            <button
              onClick={() => scrollToSection(id)}
              className={`${styles.tocLink} ${activeSection === id ? styles.tocLinkActive : ""}`}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Share buttons component
function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    { icon: <Twitter size={18} />, label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { icon: <Linkedin size={18} />, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { icon: <Facebook size={18} />, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.shareButtons}>
      <span className={styles.shareLabel}>Share:</span>
      <div className={styles.shareIcons}>
        {shareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shareBtn}
            aria-label={`Share on ${link.label}`}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={copyLink}
          className={styles.shareBtn}
          aria-label="Copy link"
        >
          {copied ? <Check size={18} className={styles.copiedIcon} /> : <LinkIcon size={18} />}
        </button>
      </div>
    </div>
  );
}

// Progress bar component
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className={styles.progressBar}
      style={{ scaleX, transformOrigin: "0%" }}
    />
  );
}

// Back to top button
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className={styles.backToTop}
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Engagement buttons
function EngagementButtons({ initialLikes }: { initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <div className={styles.engagement}>
      <motion.button
        className={`${styles.engagementBtn} ${liked ? styles.liked : ""}`}
        onClick={handleLike}
        whileTap={{ scale: 0.9 }}
      >
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
        <span>{likes}</span>
      </motion.button>
      <motion.button
        className={`${styles.engagementBtn} ${bookmarked ? styles.bookmarked : ""}`}
        onClick={() => setBookmarked(!bookmarked)}
        whileTap={{ scale: 0.9 }}
      >
        <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
      </motion.button>
      <motion.button
        className={styles.engagementBtn}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle size={20} />
      </motion.button>
    </div>
  );
}

// Process HTML content to add IDs to headings
function processContent(content: string) {
  return content.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/g, (match, level, attrs, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<h${level} id="${id}"${attrs}>${text}</h${level}>`;
  });
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = useMemo(() => blogPosts.find((p) => p.slug === slug) || null, [slug]);
  const notFound = useMemo(() => !post, [post]);

  if (notFound) {
    return (
      <>
        <Navbar />
        <main className={styles.notFound}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.notFoundContent}
            >
              <BookOpen size={64} className={styles.notFoundIcon} />
              <h1>Article Not Found</h1>
              <p>The blog post you&apos;re looking for doesn&apos;t exist.</p>
              <Link href="/blog" className={styles.backLink}>
                <ArrowLeft size={18} />
                Back to Blog
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) return null;

  const processedContent = processContent(post.content);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Navbar />
      <ReadingProgress />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero} style={{ background: `linear-gradient(135deg, ${post.bgColor}, white)` }}>
          <div className="container">
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Breadcrumb */}
              <nav className={styles.breadcrumb}>
                <Link href="/blog" className={styles.breadcrumbLink}>
                  <ArrowLeft size={16} />
                  Back to Blog
                </Link>
              </nav>

              {/* Category & Meta */}
              <div className={styles.heroMeta}>
                <motion.span
                  className={styles.category}
                  style={{ color: post.color, background: post.bgColor }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrendingUp size={14} />
                  {post.category}
                </motion.span>
                <div className={styles.metaItems}>
                  <span className={styles.metaItem}>
                    <Calendar size={14} />
                    {post.date}
                  </span>
                  <span className={styles.metaItem}>
                    <Clock size={14} />
                    {post.readTime}
                  </span>
                  <span className={styles.metaItem}>
                    <Eye size={14} />
                    {post.views.toLocaleString()} views
                  </span>
                </div>
              </div>

              {/* Title */}
              <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {post.title}
              </motion.h1>

              {/* Author */}
              <motion.div
                className={styles.author}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className={styles.authorAvatar}>
                  <Image
                    src={post.authorAvatar}
                    alt={post.author}
                    width={48}
                    height={48}
                    className={styles.avatarImg}
                  />
                </div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.author}</span>
                  <span className={styles.authorRole}>{post.authorRole}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Featured Image */}
        <section className={styles.featuredImageSection}>
          <div className="container">
            <motion.div
              className={styles.featuredImageWrapper}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image
                src={post.image}
                alt={post.title}
                width={1200}
                height={600}
                className={styles.featuredImage}
                priority
              />
              <div className={styles.imageOverlay} />
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <section className={styles.articleSection}>
          <div className="container">
            <div className={styles.articleLayout}>
              {/* Sidebar - Table of Contents */}
              <aside className={styles.sidebar}>
                <div className={styles.stickySidebar}>
                  <TableOfContents content={post.content} />
                  
                  {/* Engagement */}
                  <div className={styles.sidebarEngagement}>
                    <EngagementButtons initialLikes={post.likes} />
                    <ShareButtons title={post.title} url={currentUrl} />
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <article className={styles.article}>
                <motion.div
                  className={styles.content}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                {/* Article Footer */}
                <motion.div
                  className={styles.articleFooter}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <div className={styles.tags}>
                    <span className={styles.tagsLabel}>
                      <TagIcon size={16} />
                      Tags:
                    </span>
                    <div className={styles.tagList}>
                      {[post.category, "Healthcare", "Medical", "Wellness"].map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <ShareButtons title={post.title} url={currentUrl} />
                </motion.div>

                {/* Author Box */}
                <motion.div
                  className={styles.authorBox}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className={styles.authorBoxAvatar}>
                    <Image
                      src={post.authorAvatar}
                      alt={post.author}
                      width={80}
                      height={80}
                      className={styles.authorBoxImg}
                    />
                  </div>
                  <div className={styles.authorBoxInfo}>
                    <span className={styles.authorBoxLabel}>Written by</span>
                    <h3 className={styles.authorBoxName}>{post.author}</h3>
                    <p className={styles.authorBoxRole}>{post.authorRole}</p>
                    <p className={styles.authorBoxBio}>
                      {post.author} is a dedicated healthcare professional with years of experience in {post.category.toLowerCase()}. 
                      Passionate about patient education and advancing medical knowledge.
                    </p>
                  </div>
                </motion.div>
              </article>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className={styles.relatedSection}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className={styles.relatedTitle}>Related Articles</h2>
              <RelatedPosts currentSlug={post.slug} category={post.category} />
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className={styles.newsletterSection}>
          <div className="container">
            <motion.div
              className={styles.newsletter}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.newsletterContent}>
                <Sparkles size={32} className={styles.newsletterIcon} />
                <h2 className={styles.newsletterTitle}>Stay Updated</h2>
                <p className={styles.newsletterText}>
                  Subscribe to our newsletter for the latest health tips, medical insights, and wellness advice delivered to your inbox.
                </p>
                <form className={styles.newsletterForm}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={styles.newsletterInput}
                  />
                  <button type="submit" className={styles.newsletterBtn}>
                    Subscribe
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BackToTop />
      <Footer />
    </>
  );
}

// Tag icon component
function TagIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  );
}
