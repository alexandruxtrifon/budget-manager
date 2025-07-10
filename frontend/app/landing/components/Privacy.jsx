import { Navbar } from "../components/navbar";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: July 07, 2025</p>
        <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
        <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
        <h2>Interpretation and Definitions</h2>
        <h3>Interpretation</h3>
        <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
        <h3>Definitions</h3>
        <p>For the purposes of this Privacy Policy:</p>
        <ul>
          <li>
            <p><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</p>
          </li>
          <li>
            <p><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</p>
          </li>
          <li>
            <p><strong>Application</strong> refers to Budget Manager, the software program provided by the Company.</p>
          </li>
          <li>
            <p><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Budget Manager.</p>
          </li>
          <li>
            <p><strong>Country</strong> refers to: Romania</p>
          </li>
          <li>
            <p><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</p>
          </li>
          <li>
            <p><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</p>
          </li>
          <li>
            <p><strong>Service</strong> refers to the Application.</p>
          </li>
          <li>
            <p><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company.</p>
          </li>
          <li>
            <p><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</p>
          </li>
        </ul>

        {/* Additional privacy policy content... */}
        
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, You can contact us:</p>
        <ul>
          <li>By email: alexandruxtrifon@budgetmanager.com</li>
        </ul>
      </main>
      <Footer />
    </>
  );
}