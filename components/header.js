import Link from "next/link";
import Head from "next/head";
import { Navbar, Nav } from "react-bootstrap";

const active = "0";

const navbar = {
  backgroundColor: "rgb(6, 156, 194)",
};

const Header = () => {
  return (
    <div
      style={{
        marginBottom: "1%",
      }}
    >
      <Head>
        <title>Water Report</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="text-center">
        <span className="tinyIcon">💦</span>
        <span className="mediumIcon">💦</span>
        💦Water Report💦
        <span className="mediumIcon">💦</span>
        <span className="tinyIcon">💦</span>
      </h1>

      <Navbar expand="sm" collapseOnSelect variant="dark" style={navbar}>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav activeKey={active}>
            <Link href="/" passHref>
              <Nav.Link eventKey="0">HOME</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
};

export default Header;
