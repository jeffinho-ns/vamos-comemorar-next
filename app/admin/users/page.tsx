"use client";
import Button from "@/app/components/button/button";
import { MdAdd, MdRefresh } from "react-icons/md";
import Grid from "@/app/components/grid/grid";
import Select from "@/app/components/select/select";
import { filterData, users } from "@/app/repository/filterData";
import "./styles.sass";
import { useState } from "react";
import Input from "@/app/components/input/input";

interface IButtonProps {
  type: "button" | "submit" | "reset";
  className?: string;
  children: React.ReactNode;
}

interface IInputProps {
  type: string;
  id: string;
  value: string;
  className?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Users() {
  const [filterBy, setFilterBy] = useState<string>("");

  return (
    <div className="table-container">
      <div className="btn-table-actions">
        <Button type="button" className="btn-refresh">
          <span>
            <MdRefresh className="refresh-icon" />
          </span>
        </Button>
        <Button type="button" className="btn-add">
          <span>
            <MdAdd className="add-icon" />
          </span>
        </Button>
      </div>

      <div className="search-container">
        <Input
          type="text"
          id="search-input"
          value={filterBy}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterBy(e.target.value)}
          className="search-input"
          placeholder="Nome, E-mail ou Cpf (Apenas Números)"
        />
        <Select onChange={() => {}} className="search-select">
          <option value=""></option>
        </Select>
      </div>

      <Grid>
        <div>
          <header className="header-grid">
            <span>Icone</span>
            <span>Empresa</span>
            <span>E-mail</span>
            <span>Telefone</span>
            <span>Status</span>
            <span>Criado em</span>
          </header>
          <main className="grid-content">
            <ul>
              {users.map((user) => (
                <li key={user.name}>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span>{user.telefone}</span>
                  <span>{user.status}</span>
                  <span>{user.createAt}</span>
                </li>
              ))}
            </ul>
          </main>
        </div>
      </Grid>
    </div>
  );
}
