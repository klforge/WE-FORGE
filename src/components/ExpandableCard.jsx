import React, { useEffect, useRef, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { useNavigate } from "react-router-dom";
import "./ExpandableCard.css";

export function ExpandableCard({ cards }) {
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const id = useId();
  const navigate = useNavigate();

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
                      navigate(active.profileLink);
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
        {cards.map((card) => (
          <motion.li
            layoutId={`card-${card.name}-${id}`}
            key={`card-${card.name}-${id}`}
            onClick={() => setActive(card)}
            className="expandable-card-item"
          >
            <div className="expandable-card-item__content">
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
            </div>

            <motion.button
              layoutId={`btn-${card.name}-${id}`}
              className="expandable-card-item__btn"
            >
              View
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

export default ExpandableCard;
