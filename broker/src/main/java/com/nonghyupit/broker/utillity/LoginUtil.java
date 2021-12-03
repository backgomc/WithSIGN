package com.nonghyupit.broker.utillity;

import java.util.List;
import com.initech.eam.nls.TicketV3;
import com.initech.provider.crypto.InitechProvider;

public class LoginUtil {

    public static String cutCarriageReturn(String oriString) {
        int index = oriString.indexOf("\n");
        while (index != -1) {
            String head = oriString.substring(0, index);
            if (index != oriString.length() - 1) {
                String tail = oriString.substring(index);
                oriString = head + tail;
            } else {
                oriString = head;
            }
            index = oriString.indexOf("\n");
        }
        return oriString;
    }

    public static String getId(String ticket) {
        String id = "";
        try {
            InitechProvider xx = new InitechProvider();
            xx.changeMode();
            int firstIndex = ticket.indexOf("&&");
            int secondeIndex = ticket.lastIndexOf("&&");
            String encSKIPAndTime = ticket.substring(firstIndex + 2, secondeIndex);
            String encIDAndTOA = ticket.substring(secondeIndex + 2);
            List list = TicketV3.readIDAndTOA(encSKIPAndTime, encIDAndTOA);
            id = (String) list.get(0);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return id;
    }

    // public static void main(String[] args) {
    // System.out.println(getId(
    // "axFSGeIZjCjDpy3SyeK/EQ==&&uBdGPomT+J9LSugHqb/+CY0c/TyOFHzQfZtVkOKfAW6X8t3y6baleULk3+YVBbmB&&8hZqEb6KrSWWFPQsFeMZSw=="));
    // }
}
