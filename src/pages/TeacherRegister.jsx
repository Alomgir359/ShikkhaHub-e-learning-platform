// pages/TeacherRegister.jsx
import React, { useState } from "react";
import axios from "axios";

export default function TeacherRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    expertise: ""
  });

  const submit = async () => {
    await axios.post("http://localhost:8080/api/teachers/register", form);
    alert("Waiting for admin approval");
  };

  return (
    <div className="p-6">
      <h2>Teacher Registration</h2>

      <input placeholder="Name"
        onChange={(e)=>setForm({...form,name:e.target.value})} />

      <input placeholder="Email"
        onChange={(e)=>setForm({...form,email:e.target.value})} />

      <input placeholder="Expertise"
        onChange={(e)=>setForm({...form,expertise:e.target.value})} />

      <button onClick={submit}
        className="bg-primary text-white p-2 mt-2">
        Apply
      </button>
    </div>
  );
}