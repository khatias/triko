import React from "react";
import Banner from "./Banner";
import Navbar from "./Navbar";
function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#F9E2E7]">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32">
          <Banner />
        </div>
      </div>

      <div>
        <Navbar />
      </div>
    </header>
  );
}

export default Header;
