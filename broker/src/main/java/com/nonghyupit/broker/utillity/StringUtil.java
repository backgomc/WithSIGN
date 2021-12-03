package com.nonghyupit.broker.utillity;

import java.util.Map;
import java.util.Random;
import java.util.regex.Pattern;

public class StringUtil {

    /**
     * 오브젝트가 스트링 변환시 null 이라면 p_str 반환
     * 
     * @param p_obj
     * @param p_str
     * @return
     */
    public static String isNull(Object p_obj) {
        return StringUtil.isNull(p_obj, "");
    }

    public static String isNull(Map<String, Object> p_map, String p_key, String p_str) {
        if (p_map == null)
            return p_str;
        return isNull(p_map.get(p_key), p_str);
    }

    public static String isNull(Object p_obj, String p_str) {
        String resultStr = p_str;

        try {
            if (p_obj != null)
                resultStr = String.valueOf(p_obj);
        } catch (Exception e) {
            // nothing
        }
        return resultStr;
    }

    public static String extractNum(String str) {
        return str.replaceAll("[^0-9]", "");
    }

    public static String getFormatDateStr(String date) {
        String year = date.substring(0, 4);
        String month = date.substring(4, 6);
        String day = date.substring(6, 8);
        String formatStrDt = year + "." + month + "." + day;
        return formatStrDt;
    }

    public static String getFormatPhoneNum(String str) {
        String regEx = "(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]{3,4})([0-9]{4})";
        if (!Pattern.matches(regEx, str))
            return null;
        return str.replaceAll(regEx, "$1-$2-$3");
    }

    /**
     * 암호생성
     * 
     * @return
     */
    public static String cipher(int length) {
        Random rnd = new Random();
        StringBuffer tmp = new StringBuffer();
        for (int i = 0; i < length; i++) {
            int rIndex = rnd.nextInt(3);
            switch (rIndex) {
                case 0:
                    tmp.append((char) ((int) (rnd.nextInt(26)) + 97));
                    break;
                case 1:
                    tmp.append((char) ((int) (rnd.nextInt(26)) + 65));
                    break;
                default:
                    tmp.append(rnd.nextInt(10));
                    break;
            }
        }
        return tmp.toString();
    }

    public static String convertBase64Safe(String str) {
        return str.replace('+', '-').replace('/', '_');
    }

    public static String invertBase64Safe(String str) {
        return str.replace('-', '+').replace('_', '/');
    }

}
