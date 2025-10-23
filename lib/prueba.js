import {supabase} from "./supabase"
import { useEffect } from 'react'

export default function TestConexcio(){

    usseEffect(()=>{
        const probarConexion = async () =>{
            const {data, error} = await supabase.from("usuarios").select("*").limit(1)
            if (error){
                console.log("error en la conexion", error.message)
            }else{
                console.log("conexion exitosa", data)
            }

        }
        probarConexion()
    },[])

    return null
}

