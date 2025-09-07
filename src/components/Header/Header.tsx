import React from "react";
import Banner from "./Banner";
import Navbar from "./Navbar";
import DesktopNavBar from "./DesktopNavBar";
function Header() {
  return (
    <>
      <header className="sticky top-0 z-50  ">
        <div className="bg-[#F9E2E7]">
          <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32">
            <Banner />
          </div>
        </div>
        <div >
          <Navbar />
        </div>
      </header>
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/60 hidden lg:block">
     <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32">
      <DesktopNavBar />
      </div>
      </div>
    </>
  );
}

export default Header;
