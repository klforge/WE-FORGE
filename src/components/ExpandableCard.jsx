'use client';
import React, { useEffect, useRef, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { useRouter } from "next/navigation";
import "./ExpandableCard.css";

const cardVariants = {
  hidden: { 
    opacity: 0, 
    clipPath: "inset(0% 85% 0% 0% round 14px)" 
  },
  visible: (i) => ({
    opacity: 1,
    clipPath: "inset(0% 0% 0% 0% round 14px)",
    transition: {
      opacity: { delay: i * 0.15, duration: 0.4, ease: "easeOut" },
      clipPath: { delay: (i * 0.15) + 0.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }
    }
  })
};

const contentVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: (i * 0.15) + 0.4,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: (i * 0.15) + 0.5,
      duration: 0.5,
      ease: [0.175, 0.885, 0.32, 1.275]
    }
  })
};

export function ExpandableCard({ cards }) {
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const id = useId();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="expandable-overlay"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <div className="expandable-card-wrapper">
            <motion.div
              layoutId={`card-${active.name}-${id}`}
              ref={ref}
              className="expandable-card-expanded"
            >
              <div className="expandable-card-expanded__header">
                <div className="expandable-card-expanded__info">
                  <motion.h3
                    layoutId={`name-${active.name}-${id}`}
                    className="expandable-card-expanded__name"
                  >
                    {active.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`role-${active.name}-${id}`}
                    className="expandable-card-expanded__role"
                  >
                    {active.role}
                  </motion.p>
                </div>

                <motion.a
                  layoutId={`btn-${active.name}-${id}`}
                  href={active.profileLink || "#"}
                  className="expandable-card-expanded__btn"
                  onClick={(e) => {
                    if (active.profileLink) {
                      e.preventDefault();
                      router.push(active.profileLink);
                    } else {
                      e.preventDefault();
                    }
                  }}
                >
                  View Profile
                </motion.a>
              </div>

              <div className="expandable-card-expanded__content">
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="expandable-card-expanded__description"
                >
                  {active.description}
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ul className="expandable-card-list">
        {cards.map((card, index) => (
          <motion.li
            layoutId={`card-${card.name}-${id}`}
            key={`card-${card.name}-${id}`}
            onClick={() => setActive(card)}
            className="expandable-card-item"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <motion.div 
              className="expandable-card-item__content"
              custom={index}
              variants={contentVariants}
            >
              <motion.h3
                layoutId={`name-${card.name}-${id}`}
                className="expandable-card-item__name"
              >
                {card.name}
              </motion.h3>
              <motion.p
                layoutId={`role-${card.name}-${id}`}
                className="expandable-card-item__role"
              >
                {card.role}
              </motion.p>
            </motion.div>

            <motion.button
              layoutId={`btn-${card.name}-${id}`}
              className="expandable-card-item__btn"
              custom={index}
              variants={buttonVariants}
            >
              View Profile
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

export default ExpandableCard;
