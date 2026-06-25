"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dices, Wallet, Loader2, Trophy, Coins, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function createDiceTexture(dots: number): string {
  const size = 200;
  const dotRadius = 16;
  const padding = 40;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#e2e8f0";
  ctx.shadowColor = "rgba(255,255,255,0.1)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(4, 4, size - 8, size - 8, 16);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#1e293b";

  const positions: Record<number, [number, number][]> = {
    1: [[size / 2, size / 2]],
    2: [[padding, padding], [size - padding, size - padding]],
    3: [[padding, padding], [size / 2, size / 2], [size - padding, size - padding]],
    4: [[padding, padding], [size - padding, padding], [padding, size - padding], [size - padding, size - padding]],
    5: [[padding, padding], [size - padding, padding], [size / 2, size / 2], [padding, size - padding], [size - padding, size - padding]],
    6: [[padding, padding], [size / 2, padding], [size - padding, padding], [padding, size - padding], [size / 2, size - padding], [size - padding, size - padding]],
  };

  for (const [x, y] of positions[dots] || []) {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL();
}

function getRotationsForFace(face: number): { x: number; y: number } {
  switch (face) {
    case 1: return { x: 0, y: 0 };
    case 2: return { x: 0, y: Math.PI / 2 };
    case 3: return { x: -Math.PI / 2, y: 0 };
    case 4: return { x: Math.PI / 2, y: 0 };
    case 5: return { x: 0, y: -Math.PI / 2 };
    case 6: return { x: Math.PI, y: 0 };
    default: return { x: 0, y: 0 };
  }
}

export default function DiceGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, connect, isConnecting, publicKey } = useWallet();
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [betAmount, setBetAmount] = useState("10");
  const [guess, setGuess] = useState<number | null>(null);
  const [balance, setBalance] = useState(100);
  const [message, setMessage] = useState("");
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return;

    let mounted = true;
    const init = async () => {
      const THREE = await import("three");
      const canvas = canvasRef.current!;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.set(3, 3, 5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(5, 10, 7);
      scene.add(directionalLight);
      const backLight = new THREE.DirectionalLight(0x8888ff, 0.8);
      backLight.position.set(-3, -1, -5);
      scene.add(backLight);

      const loader = new THREE.TextureLoader();
      const textures = await Promise.all(
        [1, 2, 3, 4, 5, 6].map(async (n) => {
          const img = new Image();
          img.src = createDiceTexture(n);
          await img.decode();
          return loader.load(img.src);
        })
      );

      const materials = textures.map((t) => new THREE.MeshStandardMaterial({
        map: t,
        roughness: 0.4,
        metalness: 0.1,
      }));

      const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      const dice = new THREE.Mesh(geometry, materials);
      scene.add(dice);

      sceneRef.current = { scene, camera, renderer, dice };

      function animate() {
        if (!mounted) return;
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
      animate();
    };

    init();

    const handleResize = () => {
      if (!canvasRef.current || !sceneRef.current) return;
      const canvas = canvasRef.current;
      sceneRef.current.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  const rollDice = useCallback(() => {
    if (!sceneRef.current || rolling) return;
    setRolling(true);
    setMessage("");
    setResult(null);

    const targetFace = Math.floor(Math.random() * 6) + 1;
    const { x: tx, y: ty } = getRotationsForFace(targetFace);
    const spins = 3;
    const targetX = tx + spins * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const targetY = ty + spins * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const { dice } = sceneRef.current;
    const startRot = { x: dice.rotation.x, y: dice.rotation.y };
    const duration = 1200;
    const start = Date.now();

    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      dice.rotation.x = startRot.x + (targetX - startRot.x) * ease;
      dice.rotation.y = startRot.y + (targetY - startRot.y) * ease;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        dice.rotation.x = targetX % (Math.PI * 2);
        dice.rotation.y = targetY % (Math.PI * 2);
        setRolling(false);
        setResult(targetFace);

        const amt = parseFloat(betAmount) || 0;
        if (guess !== null) {
          const won = guess === targetFace;
          if (won) {
            const payout = amt * 5;
            setBalance((b) => b + payout);
            setMessage(`🎉 You won ${payout} USDC!`);
          } else {
            setBalance((b) => Math.max(0, b - amt));
            setMessage(`😞 You lost ${amt} USDC. It was ${targetFace}.`);
          }
        }
      }
    };
    animate();
  }, [rolling, betAmount, guess]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20">
            <Dices className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Dice Roll</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            Connect your wallet to roll the dice and win USDC.
          </p>
          <Button size="lg" onClick={connect} disabled={isConnecting}>
            {isConnecting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="mr-2 h-5 w-5" /> Connect Wallet</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/play"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lobby
      </Link>

      <div className="mb-6 text-center">
        <h1 className="mb-2 text-3xl font-bold">
          <span className="bg-gradient-to-r from-amber-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            Dice Roll
          </span>
        </h1>
        <p className="text-zinc-400">Guess the dice roll and win 5x your bet</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <Card className="border-amber-500/20 bg-amber-500/10">
          <CardContent className="flex items-center gap-2 px-4 py-2">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-amber-400">{balance} USDC</span>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex justify-center">
        <canvas
          ref={canvasRef}
          className="h-72 w-72 cursor-pointer"
          onClick={rollDice}
        />
      </div>

      {result && (
        <div className="mb-6 text-center">
          <div className="mb-2 text-6xl font-bold">{result}</div>
          <p className="text-lg text-zinc-400">Dice rolled: {result}</p>
        </div>
      )}

      {message && (
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4 text-center">
            <p className="text-lg font-semibold">{message}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardContent className="space-y-4 p-5">
          <div>
            <Label>Bet Amount (USDC)</Label>
            <Input
              type="number"
              min="1"
              max={balance}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <Label>Guess (1-6)</Label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Button
                  key={n}
                  variant={guess === n ? "default" : "outline"}
                  className={`h-12 text-lg font-bold ${guess === n ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  onClick={() => setGuess(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={rollDice}
            disabled={rolling || guess === null || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance}
          >
            {rolling ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rolling...</>
            ) : (
              <><Dices className="mr-2 h-5 w-5" /> Roll Dice</>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-zinc-500">
        Click the dice or use the button to roll. Match your guess to win 5x your bet!
      </div>
    </div>
  );
}
