"use client"
import Button from "@/app/components/button/button";
import { MdAdd, MdRefresh } from "react-icons/md";
import Grid from "@/app/components/grid/grid";
import Select from "@/app/components/select/select";
import { filterData, users } from "@/app/repository/filterData";
import "./styles.sass"
import { useState } from "react";
import Input from "@/app/components/input/input";



export default function Users() {
  const [filerBy, setFilterBy] = useState<string>()

  return (
    <div className="table-container">
      <div className="btn-table-actions">
        <Button className="btn-refresh">
          <span>
            <MdRefresh className="refresh-icon" />
          </span>
        </Button>
        <Button className="btn-add">
          <span>
            <MdAdd className="add-icon" />
          </span>
        </Button>
      </div>

      <div className="search-container">
        <Input className="search-input" placeholder="Nome, E-mail ou Cpf (Apenas Números)"
        />
        <Select
          onChange={() => {}}
          className="search-select"
        >
          <option value=""></option>
        </Select>
      </div>
      <Grid>
        {/* <Select onChange={setFilterBy} value={filerBy} className="sort-by" id="sort-by">
           <option value="">Sort By</option>
           {filterData.map((item: any) => (
                <option key={item} value={item}>{item}</option>
           ))}
        </Select> */}
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
            {users.map(user => (
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
