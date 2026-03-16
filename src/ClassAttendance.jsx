import React,{useEffect,useState} from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function ClassAttendance(){

const {id}=useParams();

const [students,setStudents]=useState([]);

useEffect(()=>{

const fetchAttendance=async()=>{

const q=query(
collection(db,"attendance"),
where("classId","==",id)
);

const snapshot=await getDocs(q);

const data=snapshot.docs.map(doc=>doc.data());

setStudents(data);

};

fetchAttendance();

},[id]);

return(

<div style={{padding:"30px"}}>

<h2>Students Attendance</h2>

<table style={{width:"100%",marginTop:"20px"}}>

<thead>

<tr>
<th>Student Name</th>
<th>Status</th>
<th>Date</th>
</tr>

</thead>

<tbody>

{students.map((s,index)=>(

<tr key={index}>
<td>{s.studentName}</td>
<td>{s.status}</td>
<td>{s.date}</td>
</tr>

))}

</tbody>

</table>

</div>

);

}