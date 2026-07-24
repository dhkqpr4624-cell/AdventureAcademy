import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ScreenId } from "../../app/routes";
import {
  BASIC_SWORD_DEFINITION,
  SwordViewModel,
} from "../../three/weapon/SwordViewModel";
import {
  WeaponAnimationController,
  type WeaponAttackType,
} from "../../three/weapon/WeaponAnimationController";

type DungeonScreenProps = {
  onNavigate: (screen: ScreenId) => void;
};

export function DungeonScreen({ onNavigate }: DungeonScreenProps) {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const animationControllerRef = useRef<WeaponAnimationController | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  useEffect(() => {
    const container = sceneContainerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b10);

    const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);
    camera.lookAt(0, -0.15, -4);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const room = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const addRoomPlane = (
      width: number,
      height: number,
      color: number,
      position: [number, number, number],
      rotation: [number, number, number],
    ) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);

      plane.position.set(...position);
      plane.rotation.set(...rotation);
      room.add(plane);
      geometries.push(geometry);
      materials.push(material);
    };

    const roomWidth = 10;
    const roomHeight = 6;
    const roomDepth = 12;

    addRoomPlane(roomWidth, roomDepth, 0x2b2927, [0, -3, -2], [
      -Math.PI / 2,
      0,
      0,
    ]);
    addRoomPlane(roomWidth, roomDepth, 0x17191e, [0, 3, -2], [
      Math.PI / 2,
      0,
      0,
    ]);
    addRoomPlane(roomWidth, roomHeight, 0x34363d, [0, 0, -8], [0, 0, 0]);
    addRoomPlane(roomWidth, roomHeight, 0x292b31, [0, 0, 4], [0, Math.PI, 0]);
    addRoomPlane(roomDepth, roomHeight, 0x24262c, [-5, 0, -2], [
      0,
      Math.PI / 2,
      0,
    ]);
    addRoomPlane(roomDepth, roomHeight, 0x24262c, [5, 0, -2], [
      0,
      -Math.PI / 2,
      0,
    ]);

    scene.add(room);

    const swordViewModel = new SwordViewModel(camera);
    const animationController = new WeaponAnimationController(
      swordViewModel,
      camera,
    );
    animationControllerRef.current = animationController;

    const updateViewport = () => {
      animationController.cancel();
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;

      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      swordViewModel.updateAspect(aspect);
    };

    updateViewport();
    swordViewModel.setDefinition(BASIC_SWORD_DEFINITION, camera.aspect);
    window.addEventListener("resize", updateViewport);

    let animationFrameId = 0;
    const clock = new THREE.Clock();
    const render = () => {
      animationController.update(clock.getDelta());
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(render);
    };
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateViewport);

      animationControllerRef.current = null;
      animationController.dispose();
      swordViewModel.dispose();
      scene.remove(room);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const playAttack = (attackType: WeaponAttackType) => {
    const controller = animationControllerRef.current;

    if (!controller || isAttacking) {
      return;
    }

    const started = controller.play(attackType, {
      onHit: () => {
        // Monster reactions and combat resolution are intentionally deferred.
      },
      onMiss: () => {
        // MISS combat feedback is intentionally deferred.
      },
      onComplete: () => setIsAttacking(false),
    });

    if (started) {
      setIsAttacking(true);
    }
  };

  return (
    <main className="game-screen dungeon-screen">
      <div
        ref={sceneContainerRef}
        className="dungeon-scene"
        aria-label="비어 있는 던전 방"
      />
      <section className="dungeon-overlay">
        <div>
          <p className="eyebrow">DUNGEON</p>
          <h1>빈 던전 방</h1>
        </div>
        <div className="dungeon-controls">
          <div className="developer-attack-controls">
            <span>개발용 검 애니메이션 테스트</span>
            <div className="button-group">
              <button
                type="button"
                disabled={isAttacking}
                onClick={() => playAttack("hit")}
              >
                공격 성공
              </button>
              <button
                type="button"
                disabled={isAttacking}
                onClick={() => playAttack("miss")}
              >
                공격 MISS
              </button>
              <button
                type="button"
                disabled={isAttacking}
                onClick={() => playAttack("finish")}
              >
                마무리 공격
              </button>
            </div>
          </div>
          <div className="button-group dungeon-navigation">
            <button type="button" onClick={() => onNavigate("baseCamp")}>
              베이스캠프로
            </button>
            <button type="button" onClick={() => onNavigate("title")}>
              타이틀로
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
