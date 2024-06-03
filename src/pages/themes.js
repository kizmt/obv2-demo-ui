import { useState } from "react";
import { Header } from "@/components/Header";

const themesPage = () => {
    const [type, setType] = useState("manual");


    return <div className="flex flex-col items-center h-full w-full px-2 md:px-4 gap-4">
    <Header path={"/tools"}/>
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl text-white font-bold">UI Themes</h1>
      <div className="w-full flex flex-col mt-4 gap-4 max-w-96 border p-4 bg-background rounded-lg">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">

            </div>
            </div>
            </div>
      </div>
      </div>}
export default themesPage;