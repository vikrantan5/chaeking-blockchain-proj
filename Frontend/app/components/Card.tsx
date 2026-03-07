// components/Card.tsx
import React from "react";
import "./styles/card.css"; // Import your CSS styles

interface CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, icon }) => {
  return (<>
    <div className="card">
      <div className="title">
        <span>{icon}</span>
        <p className="title-text">{title}</p>
      </div>
      <div className="data">
        <p>{value}</p>
      </div>
    </div>
    </>
  );
};

export default Card;
