import {  LapTimerIcon, MixerHorizontalIcon, StarFilledIcon } from "@radix-ui/react-icons";
import styles from "./SettingsBox.module.scss"

export const SettingsBox = ({}) => {

  return <div className={styles.settingsBox}>
    <div className={styles.leftSide}>
      <StarFilledIcon width={16} height={16} color="var(--highlight)"/>
    </div>
    <div className={styles.rightSide}>
      <div className={styles.settingsBtn}>
        <LapTimerIcon width={16} height={16} color="var(--highlight)"/>
        <p>Auto</p>
      </div>
      <div className={styles.settingsBtn}>
        <MixerHorizontalIcon width={16} height={16} color="var(--highlight)"/>
        <p>0.5%</p>
      </div>
    </div>
  </div>

}