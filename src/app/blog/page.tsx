"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ArrowRight, Calendar, User, Search, Tag } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./blog.module.css";

const categories = ["All", "Technology", "Patient Care", "Wellness", "Research"];

const posts = [
  { image: "/images/blog-medtech.png", category: "Technology", date: "Mar 15, 2026", author: "Dr. Sarah Chen", title: "The Future of AI in Healthcare Diagnostics", excerpt: "Discover how artificial intelligence is revolutionizing the way doctors diagnose and treat complex medical conditions.", color: "#3B82F6", bgColor: "#EFF6FF" },
  { image: "/images/blog-consultation.png", category: "Patient Care", date: "Mar 12, 2026", author: "Dr. James Wilson", title: "Why Regular Health Checkups Save Lives", excerpt: "Learn about the importance of preventive healthcare and routine checkups for early detection.", color: "#10B981", bgColor: "#D1FAE5" },
  { image: "/images/blog-wellness.png", category: "Wellness", date: "Mar 10, 2026", author: "Dr. Emily Park", title: "5 Simple Habits for Better Heart Health", excerpt: "Small lifestyle changes can make a big difference. Here are five evidence-based habits for a healthier heart.", color: "#8B5CF6", bgColor: "#EDE9FE" },
  { image: "/images/about-team.png", category: "Research", date: "Mar 8, 2026", author: "Dr. Michael Rivera", title: "Breakthroughs in Gene Therapy for Rare Diseases", excerpt: "New advances in gene therapy are opening doors for treating previously untreatable genetic conditions.", color: "#F97316", bgColor: "#FFF7ED" },
  { image: "/images/blog-medtech.png", category: "Technology", date: "Mar 5, 2026", author: "Dr. Sarah Chen", title: "Telemedicine: The New Normal in Healthcare", excerpt: "How virtual consultations are making healthcare more accessible and convenient for millions.", color: "#3B82F6", bgColor: "#EFF6FF" },
  { image: "/images/blog-consultation.png", category: "Patient Care", date: "Mar 3, 2026", author: "Dr. James Wilson", title: "Understanding Mental Health in the Workplace", excerpt: "A comprehensive guide to recognizing and addressing mental health challenges in professional settings.", color: "#10B981", bgColor: "#D1FAE5" },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = posts.filter((p) => {
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main>
        <section className={styles.pageHero}>
          <div className="container">
            <motion.div className={styles.heroContent} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="section-label"><BookOpen size={16} />Our Blog</span>
              <h1 className={styles.heroTitle}>Health Tips & <span className={styles.accent}>Insights</span></h1>
              <p className={styles.heroSubtext}>Stay informed with the latest medical research, health tips, and wellness advice.</p>
            </motion.div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search articles..." className={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className={styles.categoryTabs}>
                {categories.map((cat) => (
                  <button key={cat} className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ""}`} onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <motion.div className={styles.grid} layout>
              <AnimatePresence mode="popLayout">
                {filtered.map((post, i) => (
                  <motion.article
                    key={post.title}
                    className={styles.card}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ y: -6 }}
                  >
                    <div className={styles.imageWrapper}>
                      <Image src={post.image} alt={post.title} width={400} height={220} className={styles.cardImage} />
                      <span className={styles.category} style={{ color: post.color, background: post.bgColor }}>{post.category}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}><Calendar size={14} />{post.date}</span>
                        <span className={styles.metaItem}><User size={14} />{post.author}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      <p className={styles.cardExcerpt}>{post.excerpt}</p>
                      <a href="#" className={styles.readMore}>Read Article <ArrowRight size={16} /></a>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>

            {filtered.length === 0 && (
              <div className={styles.empty}>
                <p>No articles found. Try a different search or category.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
