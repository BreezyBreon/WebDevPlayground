import React from "react";

function Footer (){
    var date = new Date ();
    var year = date.getFullYear();

    return (
        <footer>
            <p>Copyright &copy; {year}</p>
        </footer>
    );
}

export default Footer;