package com.nonghyupit.broker.utillity;

import org.apache.log4j.Logger;

import java.util.ResourceBundle;

import com.fasoo.adk.packager.*;

public class DocuUtil {

    private static Logger logger = Logger.getLogger("DocuUtil");

    private static String fileTypeStr(int i) {
        String ret = null;
        switch (i) {
            case 20:
                ret = "파일을 찾을 수 없습니다.";
                break;
            case 21:
                ret = "파일 사이즈가 0 입니다.";
                break;
            case 22:
                ret = "파일을 읽을 수 없습니다.";
                break;
            case 29:
                ret = "암호화 파일이 아닙니다.";
                break;
            case 26:
                ret = "FSD 파일입니다.";
                break;
            case 105:
                ret = "Wrapsody 파일입니다.";
                break;
            case 106:
                ret = "NX 파일입니다.";
                break;
            case 101:
                ret = "MarkAny 파일입니다.";
                break;
            case 104:
                ret = "INCAPS 파일입니다.";
                break;
            case 103:
                ret = "FSN 파일입니다.";
                break;
        }
        return ret;
    }

    public static boolean packaging(String filePath, String fileName, String outFile) {
        logger.info("DRM Packaging");
        WorkPackager oWorkPackager = null;
        boolean bret = false;
        int type = 0;

        // 파라미터 검사
        if ("".equals(filePath) || "".equals(fileName))
            return bret;
        if (!filePath.endsWith("/"))
            filePath = filePath + "/";
        if ("".equals(outFile))
            outFile = filePath + fileName;

        // 환경설정
        String mode = !"".equals(StringUtil.isNull(System.getProperty("server.mode")))
                ? System.getProperty("server.mode")
                : "TEST";
        ResourceBundle rb = ResourceBundle.getBundle("broker");
        String drmPath = rb.getString(mode + ".drmPath");
        String drmConf = rb.getString(mode + ".drmConf");

        logger.info("sourceFile=" + filePath + fileName);
        logger.info("targetFile=" + outFile + " (Optional)");

        try {
            oWorkPackager = new WorkPackager();
            type = oWorkPackager.GetFileType(filePath + fileName);
            logger.info("[" + type + "] " + fileTypeStr(type));

            // 일반 파일의 경우에만 실행
            if (type == 29) {
                bret = oWorkPackager.DoPackagingFsn2(
                        drmPath, // fsdinit 폴더 FullPath 설정
                        drmConf, // 고객사 Key(default)
                        filePath + fileName, // 암호화 대상 문서 FullPath + FileName
                        outFile, // 암호화 완료 문서 FullPath + FileName
                        fileName, // 파일명
                        "admin", // 생성자 ID
                        "관리자", // 생성자 이름
                        "admin", "관리자", "", "", // 작성자 정보 (ID, 성명, 부서코드, 부서명) - 생성자 정보와 동일하게 가능
                        "admin", "관리자", "", "", // 소유자 정보 (ID, 성명, 부서코드, 부서명) - 생성자 정보와 동일하게 가능
                        "1" // 보안 등급 (Default : 1)
                );

                if (bret) {
                    logger.info("[" + fileName + "] packaging : " + "SUCESS");
                } else {
                    logger.info("[" + fileName + "] packaging : " + "ERROR");
                    logger.info(
                            "[" + fileName + "] oWorkPackager.getLastErrorNum() : " + oWorkPackager.getLastErrorNum());
                    logger.info(
                            "[" + fileName + "] oWorkPackager.getLastErrorStr() : " + oWorkPackager.getLastErrorStr());
                }
            }

        } catch (Exception e) {
            logger.error(e.getMessage());
        }
        return bret;
    }

    public static boolean unpackaging(String filePath, String fileName, String outFile) {
        logger.info("DRM Unpackaging");

        WorkPackager oWorkPackager = null;
        boolean bret = false;
        int type = 0;

        // 파라미터 검사
        if ("".equals(filePath) || "".equals(fileName))
            return bret;
        if (!filePath.endsWith("/"))
            filePath = filePath + "/";
        if ("".equals(outFile))
            outFile = filePath + fileName;

        // 환경설정
        String mode = !"".equals(StringUtil.isNull(System.getProperty("server.mode")))
                ? System.getProperty("server.mode")
                : "TEST";
        ResourceBundle rb = ResourceBundle.getBundle("broker");
        String drmPath = rb.getString(mode + ".drmPath");
        String drmConf = rb.getString(mode + ".drmConf");

        logger.info("sourceFile=" + filePath + fileName);
        logger.info("targetFile=" + outFile + " (Optional)");

        try {
            oWorkPackager = new WorkPackager();
            type = oWorkPackager.GetFileType(filePath + fileName);
            logger.info("[" + type + "] " + fileTypeStr(type));

            // FSN 파일의 경우에만 실행
            if (type == 103) {
                bret = oWorkPackager.DoExtract(drmPath, drmConf, filePath + fileName, outFile);
                if (bret) {
                    logger.info("[" + fileName + "] extract : " + "SUCESS");
                } else {
                    logger.info("[" + fileName + "] extract : " + "ERROR");
                    logger.info("[" + fileName + "] oWorkPackager.getLastErrorNum() : "
                            + oWorkPackager.getLastErrorNum());
                    logger.info("[" + fileName + "] oWorkPackager.getLastErrorStr() : "
                            + oWorkPackager.getLastErrorStr());
                }
            }

        } catch (Exception e) {
            logger.error(e.getMessage());
        }
        return bret;
    }

}
