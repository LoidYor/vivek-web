import { useState } from 'react';
import { motion } from 'framer-motion';
import { wallDoors } from '@/data/doors';
import Door from './Door';

export default function DoorWall() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section id="doors" className="vivek-door-wall">
      <div className="vivek-door-wall-glow" />
      <div className="container-vivek relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="vivek-door-heading"
        >
          <p>Explore the rooms</p>
          <h2>Magic happens behind the doors</h2>
        </motion.div>

        <div className="vivek-door-grid">
          {wallDoors.map((door, index) => (
            <Door
              key={door.id}
              feature={door}
              index={index}
              panelSide={index === wallDoors.length - 1 ? 'left' : 'right'}
              isActive={activeId === door.id}
              isDimmed={activeId !== null && activeId !== door.id}
              onActiveChange={(active) => setActiveId(active ? door.id : null)}
            />
          ))}
        </div>
      </div>
      <div className="vivek-door-floor" />
    </section>
  );
}
