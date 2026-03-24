"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";
import styles from "./Blog.module.css";

const posts = [
  {
    image: "/images/blog-medtech.png",
    category: "Technology",
    date: "Mar 15, 2026",
    author: "Dr. Sarah Chen",
    title: "The Future of AI in Healthcare Diagnostics",
    excerpt:
      "Discover how artificial intelligence is revolutionizing the way doctors diagnose and treat complex medical conditions.",
    categoryColor: "#0E898F",
    categoryBg: "#E6F4F4",
  },
  {
    image: "/images/blog-consultation.png",
    category: "Patient Care",
    date: "Mar 12, 2026",
    author: "Dr. James Wilson",
    title: "Why Regular Health Checkups Save Lives",
    excerpt:
      "Learn about the importance of preventive healthcare and how routine checkups can detect problems early.",
    categoryColor: "#10B981",
    categoryBg: "#D1FAE5",
  },
  {
    image: "/images/blog-wellness.png",
    category: "Wellness",
    date: "Mar 10, 2026",
    author: "Dr. Emily Park",
    title: "5 Simple Habits for Better Heart Health",
    excerpt:
      "Small lifestyle changes can make a big difference. Here are five evidence-based habits for a healthier heart.",
    categoryColor: "#8B5CF6",
    categoryBg: "#EDE9FE",
  },
];

export default function Blog() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="blog" className={styles.blog} ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <BookOpen size={16} />
            Latest Insights
          </span>
          <h2 className="section-title">
            Health Tips & <span className={styles.titleAccent}>Insights</span>
          </h2>
          <p className="section-subtitle">
            Stay informed with the latest medical research, health tips, and
            wellness advice from our expert team of physicians.
          </p>
        </motion.div>

        {/* Posts Grid */}
        <div className={styles.grid}>
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={240}
                  className={styles.cardImage}
                />
                <span
                  className={styles.category}
                  style={{
                    color: post.categoryColor,
                    background: post.categoryBg,
                  }}
                >
                  {post.category}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <Calendar size={14} />
                    {post.date}
                  </span>
                  <span className={styles.metaItem}>
                    <User size={14} />
                    {post.author}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>

                <a href="#" className={styles.readMore}>
                  Read Article
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
