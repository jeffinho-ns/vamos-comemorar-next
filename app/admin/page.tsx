"use client";
import { MdPerson, MdPlace, MdShoppingCart, MdNumbers } from "react-icons/md";
import { infos } from "../repository/filterData";

export default function Dashboard() {
  return (
    <div className="container-dashboard">
      <div className="dashboard-item">
        <span className="users">
          <MdPerson className="users-icon" />
        </span>
        <div>
          <span>{infos.users}</span>
          <h2>usuários</h2>
        </div>
      </div>
      <div className="dashboard-item">
        <span className="place">
          <MdPlace />
        </span>
        <div>
          <span>{infos.places}</span>
          <h2>Locais / Bares</h2>
        </div>
      </div>

      <div className="dashboard-item">
        <span className="reservation">
          <MdShoppingCart />
        </span>
        <div>
          <span>{infos.reservation}</span>
          <h2>reservas</h2>
        </div>
      </div>

      <div className="dashboard-item">
        <span className="points">
          <MdNumbers />
        </span>
        <div>
          <span>{infos.places}</span>
          <h2>pontos</h2>
        </div>
      </div>
    </div>
  );
}
