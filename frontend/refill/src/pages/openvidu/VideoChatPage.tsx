import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  OpenVidu,
  Session,
  StreamManager,
  Publisher,
  Device,
  Stream,
} from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./UserVideoComponent";
import Button from "components/elements/Button";
import styled from "@emotion/styled";
import { useSelector } from "react-redux";
import { RootState } from "store/reducers";
import PrevComponent from "components/openvidu/prevComponent";
// import { ScreenComponent } from "components/openvidu/screenComponent";
import ChatLog from "components/openvidu/chatLogComponent";
// import Chat from "../../components/openvidu/chatComponent";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import LogoutIcon from "@mui/icons-material/Logout";
import ChatIcon from "@mui/icons-material/Chat";
import MarkUnreadChatAltIcon from "@mui/icons-material/MarkUnreadChatAlt"; // 채팅 온거 확인 하라는 아이콘 채팅 뒤집기 가능 ?
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import { Slider } from "@mui/material";
import { Box } from "@mui/material";
import { Subscriber } from "openvidu-browser";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import OutModal from "components/openvidu/OutModal";
import ReportModal from "components/openvidu/ReportModal";
import Modal from "@mui/material/Modal";
import ReviewModal from "components/openvidu/ReviewModal";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import AiDiagnosisList from "components/myPage/AiDiagnosisList";
import ConsultingList from "components/myPage/ConsultingList";
import DownloadIcon from "@mui/icons-material/Download";
import "styles/MyPage.css";

interface MessageList {
  connectionId: string;
  nickname: string;
  message: string;
}

interface Chat {
  messageList: MessageList[];
  message: string;
}

// 이쪽도 수정필요
const APPLICATION_SERVER_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost/";

const StylePreSession = styled.div`
  background-color: #2e5077;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

const VideoChatPage: React.FC = () => {
  // const [mySessionId, setMySessionId] = useState("sessionA");
  const [myUserName, setMyUserName] = useState(
    "Participant" + Math.floor(Math.random() * 100),
  );
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [screenSession, setScreenSession] = useState<Session | undefined>(
    undefined,
  );
  const [mainStreamManager, setMainStreamManager] = useState<
    StreamManager | undefined
  >(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [screenPublisher, setScreenPublisher] = useState<Publisher | undefined>(
    undefined,
  );
  const [toggleScreenPublisher, setToggleScreenPublisher] =
    useState<boolean>(true);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState<
    Device | undefined
  >(undefined);
  const [showChat, setShowChat] = useState(false);
  const [changeChatIcon, setChangeChatIcon] = useState(false);
  const location = useLocation();
  const [vol, setVol] = useState(30);
  //받는애
  const {
    consultingId,
    sessionPk,
    token,
    shareToken,
    memberId,
    hospitalId,
    doctorId,
    hospitalName,
  } = location.state;

  const inputref = useRef<HTMLTextAreaElement>(null);
  const chatLogRef = useRef<HTMLInputElement>(null);
  const [chat, setChat] = useState<Chat>({
    messageList: [],
    message: "",
  });
  const { messageList, message } = chat;
  const [userData, setuserData] = useState({
    address: "",
    birthDay: "",
    email: "",
    name: "",
    nickname: "",
    profileImg: null,
    tel: "",
  });

  const [consultingDetailInfo, setConsultingDetailInfo] = useState("");
  const [consultingReviewInfo, setConsultingReviewInfo] = useState("");

  // icon관련
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSoundOn, seIsSoundOn] = useState(false);
  //

  // modal
  const [openOutModal, setOpenOutModal] = useState(false);
  const handleOpenOutModal = () => setOpenOutModal(true);
  const handleCloseOutModal = () => setOpenOutModal(false);

  const [openReportModal, setOpenReportModal] = useState(false);
  const handleOpenReportModal = () => setOpenReportModal(true);
  const handleCloseReportModal = () => setOpenReportModal(false);

  const [openReviewModal, setOpenReviewModal] = useState(false);
  const handleOpenRviewtModal = () => setOpenReviewModal(true);
  const handleCloseReviewModal = () => setOpenReviewModal(false);

  //

  const loginToken = useSelector((state: RootState) => state.login.token);
  const islogin = useSelector((state: RootState) => state.login.islogin);
  const ismember = useSelector((state: RootState) => state.login.ismember);
  const ishospital = useSelector((state: RootState) => state.login.ishospital);
  // const userPk = useSelector((state: RootState) => state.login.pk);

  // 유저 정보 가져오기
  const navigate = useNavigate();

  useEffect(() => {
    console.log("요기", consultingId, sessionPk, token, shareToken);
    if (islogin && ismember) {
      axios
        .get("api/v1/member/mypage", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginToken}`,
          },
        })

        .then((response) => {
          console.log(response.data);
          setuserData(response.data);
        })
        .catch((error) => {
          console.log("에러:", error);
        });
    } else if (islogin && ishospital) {
      console.log("병원입니다.");
    } else {
      // navigate("/");
      alert("접근 권한이 없습니다.");
    }
  }, []);

  // 스크롤바 내리기
  useEffect(() => {
    if (chatLogRef.current) {
      console.log("Scrolling to:", chatLogRef.current.scrollHeight);
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    } else {
      console.log("chatLogRef.current is null or undefined");
    }
  }, [messageList]);

  function handleChange(event: any) {
    if (typeof event.target.value === "string") {
      setChat((prev) => ({
        ...prev,
        message: event.target.value,
      }));
    }
  }

  function handleConsultingDetailInfo(event: any) {
    if (typeof event.target.value === "string") {
      setConsultingDetailInfo(event.target.value);
    }
    console.log(consultingDetailInfo);
  }

  function handleconsultingReviewInfo(event: any) {
    if (typeof event.target.value === "string") {
      setConsultingReviewInfo(event.target.value);
    }
    console.log(consultingReviewInfo);
  }

  function handlePresskey(event: any) {
    if (event.key === "Enter") {
      sendMessage();
      event.target.value = "";
    }
  }

  function sendMessage() {
    if (chat.message) {
      const data = {
        message: chat.message,
        nickname: userData.nickname,
      };
      if (session) {
        session.signal({
          data: JSON.stringify(data),
          type: "chat",
        });
      }
    }
    setChat((prev) => ({
      ...prev,
      message: "",
    }));
  }

  // 여기까지 채팅 부분

  // 강제로 창 종료시 동작
  useEffect(() => {
    if (!session) {
      // window.addEventListener("beforeunload", onbeforeunload);
      joinSession();
    }
  }, []);

  // 새로고침 막기
  useEffect(() => {
    const handleBeforeUnload = (e: any) => {
      e.preventDefault();
      // e.returnValue = "";
      handleOpenOutModal();
    };

    // 컴포넌트가 마운트될 때 이벤트 리스너 추가
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // mainStreamManager가 없을 경우 publisher로 설정
  useEffect(() => {
    if (!mainStreamManager && publisher) {
      setMainStreamManager(publisher);
    }

    // if (subscribers) {
    //   subscribers
    //   .filter((sub) => sub.stream.typeOfVideo !== "SCREEN")
    //   .map((sub) => (
    //     sub.stream.audioVolume
    //   ))
    // }
  }, [mainStreamManager, publisher, subscribers]);

  useEffect(() => {
    if (!showChat) {
      setChangeChatIcon(true);
      console.log("활성화");
    }
    console.log("??????????모지");
  }, [chat.messageList, chat]);

  // 나갈때 동작
  const onbeforeunload = () => {
    // session 떠나기
    // leaveSession();
  };

  // const handleChangeSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMySessionId(e.target.value);
  // };

  // const handleChangeUserName = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMyUserName(e.target.value);
  // };
  //

  // 메인 스트림과 클릭된 서브 스트림을 전환하는 함수
  const toggleMainAndSubStream = (target: StreamManager) => {
    if (target === publisher) {
      // 클릭된 스트림이 현재 publisher일 경우
      setMainStreamManager(publisher); // mainStreamManager를 publisher로 설정
    } else {
      setMainStreamManager(target); // 클릭된 서브 스트림을 메인 스트림으로 설정
    }
  };

  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers((prevSubscribers) =>
      prevSubscribers.filter((sub) => sub !== streamManager),
    );
  };

  // 의사전용 joinsession
  const joinSession = async () => {
    const OV = new OpenVidu();
    const mySession = OV.initSession();
    setSession(mySession);

    // Specify the actions when events take place in the session
    mySession.on("streamCreated", (event) => {
      const subscriber = mySession.subscribe(event.stream, undefined);
      setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
    });

    mySession.on("streamDestroyed", (event) => {
      deleteSubscriber(event.stream.streamManager);
    });

    mySession.on("exception", (exception) => {
      console.warn(exception);
    });

    mySession.on("signal:chat", (event) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data);
        if (event.from) {
          messageList.push({
            connectionId: event.from.connectionId,
            nickname: userData.nickname,
            message: data.message,
          });
          setChat((prev) => ({ ...prev, messageList }));
        }
        // scrollToBottom()
      }
    });

    try {
      if (token) {
        await mySession.connect(token);

        const myPublisher = await OV.initPublisherAsync("container-video", {
          audioSource: undefined,
          videoSource: undefined,
          publishAudio: true,
          publishVideo: true,
          resolution: "800x600",
          frameRate: 30,
          insertMode: "APPEND",
          mirror: false,
        });

        await setPublisher(myPublisher);
        mySession.publish(myPublisher);
      }

      // 이제부터 screen 부분
      if (ishospital && shareToken) {
        const OVS = await new OpenVidu();
        const myScreenSession = await OVS.initSession();
        await setScreenSession(myScreenSession);

        // const tokenScreen = await getToken();
        const tokenScreen = shareToken;
        await myScreenSession.connect(tokenScreen, { clientData: myUserName });
        const screenPublisher = await OV.initPublisherAsync(
          "container-screen",
          {
            videoSource: "screen", // 화면 공유를 위해 'screen'을 지정
            publishAudio: false, // 오디오를 포함할 것인지 여부
            publishVideo: true, // 비디오를 포함할 것인지 여부
            resolution: "1280x720", // 스크린 공유의 해상도
            frameRate: 30, // 스크린 공유의 프레임 레이트
            insertMode: "APPEND", // 비디오가 타겟 엘리먼트에 삽입되는 방식
            mirror: false, // 로컬 비디오 미러링 여부
          },
        );

        await setScreenPublisher(screenPublisher);
        myScreenSession.publish(screenPublisher);
      }

      const devices = await OV.getDevices();
      const videoDevices = devices.filter(
        (device: any) => device.kind === "videoinput",
      );
      if (publisher) {
        const currentVideoDeviceId = publisher.stream
          .getMediaStream()
          .getVideoTracks()[0]
          .getSettings().deviceId;
        const currentVideoDevice = videoDevices.find(
          (device: any) => device.deviceId === currentVideoDeviceId,
        );
        setCurrentVideoDevice(currentVideoDevice);
        setMainStreamManager(publisher);
        setPublisher(publisher);
      }

      console.log("구독자들 다보여줘 :", subscribers);
    } catch (error) {
      console.log("There was an error connecting to the session:", error);
    }
  };

  // screenShare 토글 버튼
  const toggleScreenShare = () => {
    if (screenSession && screenPublisher && toggleScreenPublisher) {
      // disconnect
      setToggleScreenPublisher(false);
      screenSession.unpublish(screenPublisher);
    } else if (screenSession && screenPublisher) {
      // connect
      setToggleScreenPublisher(true);
      screenSession.publish(screenPublisher);
    }
  };

  const leaveSession = () => {
    if (ishospital) {
      if (session) {
        session.disconnect();
      }
      if (screenSession) {
        console.log(screenSession);
        screenSession.disconnect();
      }

      // Empty all properties...
      setSession(undefined);
      setScreenSession(undefined);
      setSubscribers([]);
      // setMySessionId("SessionA");
      setMyUserName("Participant" + Math.floor(Math.random() * 100));
      setMainStreamManager(undefined);
      setPublisher(undefined);
      setScreenPublisher(undefined);
    }

    navigate("/");
  };

  const camOnOff = () => {
    if (session) {
      publisher?.publishVideo(!publisher?.stream?.videoActive);
      setIsCamOn(!isCamOn);
    }
  };

  const soundOnOff = () => {
    if (session) {
      publisher?.publishAudio(!publisher?.stream?.audioActive);
      console.log(subscribers);
      console.log(subscribers.length);
      setIsMicOn(!isMicOn);
    }
  };

  const soundControl = () => {
    if (session) {
      console.log(session);
      console.log(publisher);
      seIsSoundOn(!isSoundOn);
    }
  };

  const accessToken = token;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const handleShowBox = () => {
    setShowChat(!showChat);
    setChangeChatIcon(false);
  };

  function preventHorizontalKeyboardNavigation(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
    }
  }

  return (
    <div>
      {session ? (
        <div
          className="container"
          style={{
            minWidth: "100%",
            minHeight: "100vh",
            backgroundColor: "#2E5077",
            padding: "20px 20px",
            boxSizing: "border-box",
            color: "white",
          }}
        >
          <div
            id="session"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "between",
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
            <div className="flex justify-between" style={{ width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  width: "50%",
                  minWidth: "500px",
                  borderRadius: "3px",
                  border: "5px solid black",
                }}
              >
                <UserVideoComponent streamManager={mainStreamManager} />
                {subscribers && mainStreamManager === publisher ? (
                  subscribers
                    .filter((sub) => sub.stream.typeOfVideo !== "SCREEN")
                    .map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          width: "25%",
                          minWidth: "150px",
                          position: "absolute",
                          top: "30px",
                          left: "30px",
                        }}
                        onClick={() => toggleMainAndSubStream(sub)}
                      >
                        <UserVideoComponent streamManager={sub} />
                      </div>
                    ))
                ) : publisher !== undefined ? (
                  <div
                    style={{
                      width: "25%",
                      minWidth: "150px",
                      position: "absolute",
                      top: "30px",
                      left: "30px",
                    }}
                    onClick={() => toggleMainAndSubStream(publisher)}
                  >
                    <UserVideoComponent streamManager={publisher} />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "48%",
                  minHeight: "100%",
                }}
              >
                <PrevComponent>
                  <div>
                    {toggleScreenPublisher && ishospital ? (
                      <UserVideoComponent streamManager={screenPublisher} />
                    ) : null}
                  </div>
                  {ismember
                    ? subscribers
                        .filter((sub) => sub.stream.typeOfVideo === "SCREEN")
                        .map((sub) => (
                          <div key={sub.id}>
                            <UserVideoComponent streamManager={sub} />
                          </div>
                        ))
                    : null}
                  {ishospital ? (
                    <div
                      style={{
                        display: toggleScreenPublisher ? "none" : "block",
                        color: "black",
                        width: "95%",
                      }}
                    >
                      <h2 style={{ fontWeight: "700" }}>이전 상담 내역</h2>
                      <div
                        style={{
                          border: "1px solid grey",
                          height: "100px",
                          marginBottom: "10px",
                        }}
                        className="scroll-ai-box"
                      >
                        <ConsultingList userPk={memberId} />
                      </div>
                      <h2 style={{ fontWeight: "700" }}>AI 자가진단</h2>
                      <div
                        style={{ border: "1px solid grey", height: "150px" }}
                        className="scroll-ai-box"
                      >
                        <AiDiagnosisList memberId={memberId} />
                      </div>
                    </div>
                  ) : null}
                  {ismember &&
                  subscribers.filter(
                    (sub) => sub.stream.typeOfVideo === "SCREEN",
                  ).length === 0 ? (
                    <div style={{ color: "black", width: "95%" }}>
                      <h2 style={{ fontWeight: "700" }}>이전 상담 내역</h2>
                      <div
                        style={{
                          border: "1px solid grey",
                          height: "100px",
                          marginBottom: "10px",
                        }}
                        className="scroll-ai-box"
                      >
                        <ConsultingList userPk={memberId} />
                      </div>
                      <h2 style={{ fontWeight: "700" }}>AI 자가진단</h2>
                      <div
                        style={{ border: "1px solid grey", height: "150px" }}
                        className="scroll-ai-box"
                      >
                        <AiDiagnosisList memberId={memberId} />
                      </div>
                    </div>
                  ) : null}
                </PrevComponent>
                {ishospital ? (
                  <textarea
                    onChange={handleConsultingDetailInfo}
                    placeholder="진료 소견서를 작성해주세요. 소견서는 자동 저장됩니다."
                    style={{
                      marginTop: "20px",
                      height: "30%",
                      backgroundColor: "#222222",
                      padding: "15px",
                      fontSize: "25px",
                      borderRadius: "3px",
                      border: "5px solid black",
                    }}
                  ></textarea>
                ) : (
                  <textarea
                    onChange={handleconsultingReviewInfo}
                    placeholder="상담 리뷰를 이곳에서 미리 작성해 둘 수 있어요!"
                    style={{
                      marginTop: "20px",
                      height: "30%",
                      backgroundColor: "#222222",
                      padding: "15px",
                      fontSize: "25px",
                      borderRadius: "3px",
                      border: "5px solid black",
                    }}
                  ></textarea>
                )}
              </div>
            </div>
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                left: "0",
                padding: "20px",
                width: "100%",
              }}
            >
              <div
                id="session-footer"
                className="flex justify-between"
                style={{ width: "100%" }}
              >
                <h1
                  id="session-title"
                  className="text-xl font-bold"
                  style={{ display: "flex", alignItems: "flex-end" }}
                >
                  {sessionPk}
                </h1>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <CameraswitchIcon
                    onClick={() => {
                      if (
                        publisher &&
                        subscribers &&
                        mainStreamManager === publisher
                      ) {
                        // 필터링된 서브 스트림 중에서 적절한 대상을 선택
                        const targetSubscriber = subscribers.find(
                          (sub) => sub.stream.typeOfVideo !== "SCREEN",
                        );

                        // 적절한 대상이 있으면 해당 스트림을 메인 스트림으로 설정
                        if (targetSubscriber) {
                          toggleMainAndSubStream(targetSubscriber);
                        }
                      } else if (publisher) {
                        // publisher가 undefined가 아닌 경우만 전달
                        toggleMainAndSubStream(publisher);
                      }
                    }}
                    fontSize="large"
                    sx={{ margin: "0px 13px", cursor: "pointer" }}
                  />
                  {isCamOn ? (
                    <VideocamIcon
                      onClick={camOnOff}
                      fontSize="large"
                      sx={{ margin: "0px 13px", cursor: "pointer" }}
                    ></VideocamIcon>
                  ) : (
                    <VideocamOffIcon
                      onClick={camOnOff}
                      fontSize="large"
                      sx={{ margin: "0px 13px", cursor: "pointer" }}
                    ></VideocamOffIcon>
                  )}
                  {isMicOn ? (
                    <MicIcon
                      onClick={soundOnOff}
                      fontSize="large"
                      sx={{ margin: "0px 13px", cursor: "pointer" }}
                    ></MicIcon>
                  ) : (
                    <MicOffIcon
                      onClick={soundOnOff}
                      fontSize="large"
                      sx={{ margin: "0px 13px", cursor: "pointer" }}
                    ></MicOffIcon>
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Box
                      sx={{
                        height: 60,
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column-reverse",
                        marginBottom: "15px",
                      }}
                    >
                      <Slider
                        sx={{
                          color: "skyblue",
                          display: isSoundOn ? "block" : "none",
                          '& input[type="range"]': {
                            WebkitAppearance: "slider-vertical",
                          },
                        }}
                        orientation="vertical"
                        defaultValue={30}
                        aria-label="Volume"
                        valueLabelDisplay="auto"
                        onKeyDown={preventHorizontalKeyboardNavigation}
                      />
                    </Box>
                    <VolumeUpIcon
                      onClick={soundControl}
                      fontSize="large"
                      sx={{ margin: "0px 13px", cursor: "pointer" }}
                    ></VolumeUpIcon>
                  </div>
                  {ishospital ? (
                    toggleScreenPublisher ? (
                      <ScreenShareIcon
                        onClick={toggleScreenShare}
                        fontSize="large"
                        sx={{ margin: "0px 13px", cursor: "pointer" }}
                      ></ScreenShareIcon>
                    ) : (
                      <StopScreenShareIcon
                        onClick={toggleScreenShare}
                        fontSize="large"
                        sx={{ margin: "0px 13px", cursor: "pointer" }}
                      ></StopScreenShareIcon>
                    )
                  ) : null}
                  <NotificationImportantIcon
                    onClick={handleOpenReportModal}
                    fontSize="large"
                    sx={{ margin: "0px 13px", color: "red", cursor: "pointer" }}
                  />
                  <LogoutIcon
                    onClick={handleOpenOutModal}
                    fontSize="large"
                    sx={{
                      margin: "0px 13px",
                      cursor: "pointer",
                      color: "#ff8d13",
                    }}
                  ></LogoutIcon>
                  <Modal
                    open={openOutModal}
                    onClose={handleCloseOutModal}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <OutModal
                      onClose={handleCloseOutModal}
                      onOpen={handleOpenRviewtModal}
                    ></OutModal>
                  </Modal>

                  <Modal
                    open={openReportModal}
                    onClose={handleCloseReportModal}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ReportModal
                      onClose={handleCloseReportModal}
                      consultingId={consultingId}
                    ></ReportModal>
                  </Modal>

                  <Modal
                    open={openReviewModal}
                    onClose={handleCloseReviewModal}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ReviewModal
                      consultingId={consultingId}
                      consultingDetailInfo={consultingDetailInfo}
                      consultingReviewInfo={consultingReviewInfo}
                      sessionPk={sessionPk}
                      memberId={memberId}
                      hospitalId={hospitalId}
                      doctorId={doctorId}
                      hospitalName={hospitalName}
                      leaveSession={leaveSession}
                    ></ReviewModal>
                  </Modal>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  {changeChatIcon ? (
                    <MarkUnreadChatAltIcon
                      fontSize="large"
                      onClick={handleShowBox}
                      sx={{ cursor: "pointer", transform: "scaleX(-1)" }}
                    />
                  ) : (
                    <ChatIcon
                      fontSize="large"
                      onClick={handleShowBox}
                      sx={{ cursor: "pointer", transform: "scaleX(-1)" }}
                    ></ChatIcon>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "70px",
                right: "50px",
                width: "350px",
                height: "500px",
                // backgroundColor: "#eeeeee",
                display: showChat ? "block" : "none",
                borderRadius: "7px",
                overflow: "hidden",
                border: "2px solid grey",
                backgroundColor: "#282829",
              }}
            >
              <div
                ref={chatLogRef}
                style={{
                  padding: "20px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {messageList.map(({ message, nickname, connectionId }, idx) => (
                  <ChatLog
                    key={idx}
                    chatData={{
                      mySessionId: session.connection.connectionId,
                      connectionId: connectionId,
                      nickname: nickname,
                      message: message,
                    }}
                  ></ChatLog>
                ))}
              </div>
              <textarea
                onChange={handleChange}
                onKeyUp={handlePresskey}
                ref={inputref}
                style={{
                  position: "absolute",
                  bottom: "0",
                  width: "100%",
                  height: "100px",
                  padding: "5px",
                  borderBottomLeftRadius: "7px",
                  borderBottomRightRadius: "7px",
                  borderTop: "1px solid darkgrey",
                  backgroundColor: "#343434",
                }}
              ></textarea>
            </div>
          </div>
        </div>
      ) : (
        <StylePreSession>상담 준비 중 입니다 ...</StylePreSession>
      )}
    </div>
  );
};

export default VideoChatPage;
