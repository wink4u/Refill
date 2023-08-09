import * as React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
// react hooks 3대장
// useSelector
// emotion styles를 써서 components
// typescript

interface WaitingHospitalResponse {
  id: number;
  loginId: string;
  name: string;
  address: string;
  tel: string;
  email: string;
  hospitalProfileImg: string;
  registrationImg: string;
}


const Admin: React.FC = () => {
  // 상태 설정
  const [hospitals, setHospitals] = React.useState<WaitingHospitalResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // API 호출 효과 설정
  React.useEffect(() => {
    async function fetchHospitals() {
      try {
        const response = await axios.get<WaitingHospitalResponse[]>("/hospitals");
        setHospitals(response.data);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHospitals();
  }, []);

  // 로딩 중이면 로딩 텍스트 출력
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />

      {/* 간단한 테이블 출력 */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Login ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Tel</th>
            <th>Email</th>
            <th>Profile Image</th>
            <th>Registration Image</th>
          </tr>
        </thead>
        <tbody>
          {hospitals.map(hospital => (
            <tr key={hospital.id}>
              <td>{hospital.id}</td>
              <td>{hospital.loginId}</td>
              <td>{hospital.name}</td>
              <td>{hospital.address}</td>
              <td>{hospital.tel}</td>
              <td>{hospital.email}</td>
              <td><img src={hospital.hospitalProfileImg} alt="Profile" width="50" /></td>
              <td><img src={hospital.registrationImg} alt="Registration" width="50" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Footer />
    </div>
  );
}

export default Admin;